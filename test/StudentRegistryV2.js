const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
    const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
  const { ethers } = require("hardhat");
  
  describe("StudentRegistryV2 Test Suite", () => {
    // deploy util function
    const deployUtil = async () => {
      const [ owner, addr1, addr2 ] = await ethers.getSigners();
      const StudentRegistryV2 = await ethers.getContractFactory("StudentRegistryV2"); // instance of StudentRegistryV2 contract in Contracts folder
      const deployedStudentRegistryV2 = await StudentRegistryV2.deploy(); // the deployed version of the StudentRegistryV2 contract in the network
      return { deployedStudentRegistryV2, owner, addr1, addr2 }; // returning the deployed StudentRegistryV2 instance
    };
  
    describe("Deployment", () => {
      it("should deploy succesfully ", async () => {
        const deployedStudentRegistryV2 = await loadFixture(deployUtil);
  
        
      });
    });

    describe("Pay Fees", () => {
      it("should successfully pay fees", async () => {
        const {deployedStudentRegistryV2, addr1} = await loadFixture(deployUtil);

        await expect(
          deployedStudentRegistryV2.connect(addr1).payFee({value: 1})
        ).to.not.be.reverted
      })

      it("should revert if user calls function without payment", async () => {
        const {deployedStudentRegistryV2} = await loadFixture(deployUtil);

        await expect(
          deployedStudentRegistryV2.payFee({value: 0})
        ).to.be.revertedWith("No ether sent");
      })

      it("should reduce the balance of the caller of the function", async () => {
        const {deployedStudentRegistryV2, addr1} = await loadFixture(deployUtil);

        const balanceBefore = await ethers.provider.getBalance(addr1.address);
        console.log(balanceBefore);

        await deployedStudentRegistryV2.connect(addr1).payFee({value: 1})
        const balanceAfter = await ethers.provider.getBalance(addr1.address)
        console.log(balanceAfter);

        await expect(balanceBefore).to.be.greaterThan(balanceAfter);
      })

      it("should increase the balance of the owner", async () => {
        const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);

        const OwnerBalanceBefore = await ethers.provider.getBalance(owner.address);
        console.log(OwnerBalanceBefore);

        await deployedStudentRegistryV2.connect(addr1).payFee({value: 1})
        const OwnerBalanceAfter = await ethers.provider.getBalance(owner.address)
        console.log(OwnerBalanceAfter);

        await expect(OwnerBalanceBefore).to.be.lessThan(OwnerBalanceAfter);
      })

      it("should return true in the hasPaid Mapping", async () => {
        const {deployedStudentRegistryV2, addr1} = await loadFixture(deployUtil);

        await deployedStudentRegistryV2.connect(addr1).payFee({value: 1})
        const hasPaid = await deployedStudentRegistryV2.hasPaidMapping(addr1);
        console.log(hasPaid);

        await expect(hasPaid).to.eq(true);
      })
    })

    describe("Register Student", () => {
      describe("Validations", () => {
        it("should revert when trying to register a student twice", async () => {
          const {deployedStudentRegistryV2, addr1} = await loadFixture(deployUtil);
          
          await deployedStudentRegistryV2.payFee({ value: 1 })
          await deployedStudentRegistryV2.register(addr1, "Moses", 18);

          await expect(
            deployedStudentRegistryV2.register(addr1, "Moses", 18)
          ).to.be.revertedWith("You're already registered"); 
        })

        it("should revert when trying to register without paying", async () => {
          const {deployedStudentRegistryV2, addr1} = await loadFixture(deployUtil);

          await expect(
            deployedStudentRegistryV2.register(addr1, "Moses", 18)
          ).to.be.revertedWith("You must pay first");
        })

        it("should be reverted when trying to register when name is empty", async () => {
          const {deployedStudentRegistryV2, addr1} = await loadFixture(deployUtil);
          
          await deployedStudentRegistryV2.payFee({ value: 1 });

          await expect(
            deployedStudentRegistryV2.register(addr1, "", 18)
          ).to.be.revertedWith("No name has been inputed"); 
        })

        it("should be reverted when trting to register under age student", async () => {
          const {deployedStudentRegistryV2, addr1} = await loadFixture(deployUtil);
          
          await deployedStudentRegistryV2.payFee({ value: 1 });

          await expect(
            deployedStudentRegistryV2.register(addr1, "Moses", 17)
          ).to.be.revertedWith("age should be 18 or more");
        })
      })

      describe("Proper Registration", () => {
        describe("Successful registration", () => {
          it("should successfully register student", async () => {
            const {deployedStudentRegistryV2, addr1} = await loadFixture(deployUtil);

            await deployedStudentRegistryV2.payFee({value: 1});

            await expect(
              deployedStudentRegistryV2.register(addr1, "Moses", 19)
            ).to.not.be.reverted;
          })

          it("should successfully add a student to the tempStudents mapping after registration", async () => {
            const {deployedStudentRegistryV2, addr1, addr2} = await loadFixture(deployUtil);

            await deployedStudentRegistryV2.payFee({value: 1});
            await deployedStudentRegistryV2.register(addr1, "Moses", 19);

            const student1 = await deployedStudentRegistryV2.tempstudentsMapping(addr1);
            console.log(student1.toString());

            await expect(
              student1.toString()
            ).to.eq(`${addr1.address},Moses,0,19,true,false`)
          })
        })
      })

      describe("Events", () => {
        it("should emit an event when a student is added", async () => {
          const {deployedStudentRegistryV2, addr1} = await loadFixture(deployUtil);

          await deployedStudentRegistryV2.payFee({value: 1});

          await expect(
            deployedStudentRegistryV2.register(addr1, "Moses", 19)
          ).to.emit(deployedStudentRegistryV2, "registerStudent")
          .withArgs(addr1, "Moses", 19);
        })
      })
    })

    describe("Authorize Student Registration", () => {
      describe("Validations", () => {
        it("should only allow owner to authorize", async () => {
          const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);

          await deployedStudentRegistryV2.payFee({value: 1})
          await deployedStudentRegistryV2.register(addr1, "Moses", 19)

          await expect(
            deployedStudentRegistryV2.connect(owner).authorizeStudentRegistration(addr1)
          ).to.not.be.reverted;
        })

        it("should revert when a non-owner tries to authorize", async () => {
          const {deployedStudentRegistryV2, addr1} = await loadFixture(deployUtil);

          await deployedStudentRegistryV2.payFee({value: 1})
          await deployedStudentRegistryV2.register(addr1, "Moses", 19)

          await expect(
            deployedStudentRegistryV2.connect(addr1).authorizeStudentRegistration(addr1)
          ).to.be.revertedWith("Caller not owner");
        })

        it("should revert when trying to authorize a student who hasn't resgistered", async () => {
          const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);

          await expect(
            deployedStudentRegistryV2.connect(owner).authorizeStudentRegistration(addr1)
          ).to.be.revertedWith("Invalid Address");
        })

        it("should revert when trying to authorize a student who is already authorized", async () => {
          const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);

          await deployedStudentRegistryV2.payFee({value: 1});
          await deployedStudentRegistryV2.register(addr1, "Moses", 19)

          await deployedStudentRegistryV2.connect(owner).authorizeStudentRegistration(addr1)

          await expect(
            deployedStudentRegistryV2.connect(owner).authorizeStudentRegistration(addr1)
          ).to.be.revertedWith("You've been authorized");
        })
      })

      describe("Successful authorization", () => {
        it("should successfully authorize a student", async () => {
          const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);

          await deployedStudentRegistryV2.payFee({value: 1});
          await deployedStudentRegistryV2.register(addr1, "Moses", 19)

          await expect(
            deployedStudentRegistryV2.connect(owner).authorizeStudentRegistration(addr1)
          ).to.not.be.reverted;
        })

        it("should successfully add an authorized student to studentsMapping", async () => {
          const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);

          await deployedStudentRegistryV2.payFee({value: 1});
          await deployedStudentRegistryV2.register(addr1, "Moses", 19)
          await deployedStudentRegistryV2.connect(owner).authorizeStudentRegistration(addr1);

          const authStudent = await deployedStudentRegistryV2.studentsMapping(addr1);
          //console.log(authStudent);

          await expect(
            authStudent.toString()
          ).to.eq(`${addr1.address},Moses,1,19,true,false`)
        })
      })

      describe("Events", () => {
        it("should emit an event when a student is authorized", async () => {
          const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);

          await deployedStudentRegistryV2.payFee({value: 1});
          await deployedStudentRegistryV2.register(addr1, "Moses", 19)

          await expect(
            deployedStudentRegistryV2.connect(owner).authorizeStudentRegistration(addr1)
          ).to.emit(deployedStudentRegistryV2, "authorizeStudentReg")
          .withArgs(addr1);
        })
      })
    })

    describe("Get Students", () => {
      it("should allow only the owner to get student", async () => {
        const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);

        await deployedStudentRegistryV2.payFee({value: 1});
        await deployedStudentRegistryV2.register(addr1, "Moses", 19)
        await deployedStudentRegistryV2.connect(owner).authorizeStudentRegistration(addr1);

        await expect(
          deployedStudentRegistryV2.connect(owner).getStudent(1)
        ).to.not.be.reverted;

        await expect(
          deployedStudentRegistryV2.connect(addr1).getStudent(1)
        ).to.be.revertedWith("Caller not owner");
      })

      it("should get the correct student", async () => {
        const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);
        
        await deployedStudentRegistryV2.payFee({value: 1});
        await deployedStudentRegistryV2.register(addr1, "Moses", 19)
        await deployedStudentRegistryV2.connect(owner).authorizeStudentRegistration(addr1);

        const student1 = await deployedStudentRegistryV2.getStudent(1);

        await expect(student1.toString()).to.eq(`${addr1.address},Moses,1,19,true,false`);
      })

      it("should revert when trying to get a student that has not been authorised", async () => {
        const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);
        
        await deployedStudentRegistryV2.payFee({value: 1});
        await deployedStudentRegistryV2.register(addr1, "Moses", 19)

        await expect(
          deployedStudentRegistryV2.connect(owner).getStudent(1)
        ).to.be.reverted;
      })
    })

    describe("Get student from mapping", () => {
      it("should allow only the owner to get student from Mapping", async () => {
        const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);

        await deployedStudentRegistryV2.payFee({value: 1});
        await deployedStudentRegistryV2.register(addr1, "Moses", 19)
        await deployedStudentRegistryV2.connect(owner).authorizeStudentRegistration(addr1);

        await expect(
          deployedStudentRegistryV2.connect(owner).getStudentFromMapping(addr1)
        ).to.not.be.reverted;

        await expect(
          deployedStudentRegistryV2.connect(addr1).getStudentFromMapping(addr1)
        ).to.be.revertedWith("Caller not owner");
      })

      it("should return the correct student", async () => {
        const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);

        await deployedStudentRegistryV2.payFee({value: 1});
        await deployedStudentRegistryV2.register(addr1, "Moses", 19)
        await deployedStudentRegistryV2.connect(owner).authorizeStudentRegistration(addr1);

        const student1 = await deployedStudentRegistryV2.connect(owner).getStudentFromMapping(addr1)

        expect(student1).to.deep.equal(
          await deployedStudentRegistryV2.studentsMapping(addr1)
        )
      })
    })

    describe("Delete Student", () => {
      it("should allow only the owner to delete a student", async () => {
        const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);

        await deployedStudentRegistryV2.payFee({value: 1});
        await deployedStudentRegistryV2.register(addr1, "Moses", 19)
        await deployedStudentRegistryV2.connect(owner).authorizeStudentRegistration(addr1);

        await expect(
          deployedStudentRegistryV2.connect(addr1).deleteStudent(addr1)
        ).to.be.revertedWith("Caller not owner");

        await expect(
          deployedStudentRegistryV2.connect(owner).deleteStudent(addr1)
        ).to.not.be.reverted;
      })

      it("should be reverted when trying to delete an invalid student", async () => {
        const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);

        await deployedStudentRegistryV2.payFee({value: 1});
        await deployedStudentRegistryV2.register(addr1, "Moses", 19)

        await expect(
          deployedStudentRegistryV2.connect(owner).deleteStudent(addr1)
        ).to.be.revertedWith("Student does not exist");
      })
    })

    describe("Update Student from mapping", () => {
      it("should only allow user to update student", async () => {
        const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);

        await deployedStudentRegistryV2.payFee({value: 1});
        await deployedStudentRegistryV2.register(addr1, "Moses", 19);
        await deployedStudentRegistryV2.authorizeStudentRegistration(addr1);

        await expect(
          deployedStudentRegistryV2.connect(owner).updateStudentMapping(addr1, "Moses", 20)
        ).to.not.be.reverted;

        await expect(
          deployedStudentRegistryV2.connect(addr1).updateStudentMapping(addr1, "Moses", 20)
        ).to.be.revertedWith("Caller not owner");
      })
      
      it("should properly update the student details", async () => {
        const {deployedStudentRegistryV2, owner, addr1} = await loadFixture(deployUtil);

        await deployedStudentRegistryV2.payFee({value: 1});
        await deployedStudentRegistryV2.register(addr1, "Moses", 19);
        await deployedStudentRegistryV2.authorizeStudentRegistration(addr1);

        await deployedStudentRegistryV2.updateStudentMapping(addr1, "Moses Dave", 20);

        expect(
          await deployedStudentRegistryV2.getStudentFromMapping(addr1)
        ).to.deep.equal(await deployedStudentRegistryV2.studentsMapping(addr1))
      })
    })
  });
  
