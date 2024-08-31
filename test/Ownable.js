const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
    const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
const { ethers } = require("hardhat");
  
  describe("Ownable Test Suite", () => {
    // deploy util function
    const deployUtil = async () => {
      const Ownable = await ethers.getContractFactory("Ownable"); // instance of Ownable contract in Contracts folder
      const deployedOwnable = await Ownable.deploy(); // the deployed version of the Ownable contract in the network
      const [owner, addr1, addr2] = await ethers.getSigners();
      const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' 
      return { deployedOwnable, owner, addr1, addr2, ZERO_ADDRESS }; // returning deployed ownable contract instance and built-in HH accounts
    };
  
    describe("Deployment", () => {
      it("should deploy succesfully and set owner", async () => {
        const { deployedOwnable, owner, addr1, addr2 } = await loadFixture(deployUtil);
        let ownableOwner = await deployedOwnable.getOwner()
        console.log("ownable owner____", )
        expect(ownableOwner).to.eq(owner)
        expect(ownableOwner).to.not.eq(addr1)
        expect(ownableOwner).to.not.eq(addr2)

      });
    });

    describe("Transactions", () => {
      describe("Validations", () => {
        it("should revert attempt by non-owner to change Ownable ownership", async () => {
          const { deployedOwnable, addr1, addr2 } = await loadFixture(deployUtil);
          await expect(deployedOwnable.connect(addr1).changeOwner(addr2)).to.be.revertedWith("Caller not owner")
        })

        it("should revert attempt by owner to transfer Ownable ownership to address 0", async () => {
          const { deployedOwnable, owner, ZERO_ADDRESS} = await loadFixture(deployUtil);
          await expect(deployedOwnable.connect(owner).changeOwner(ZERO_ADDRESS)).to.be.revertedWith("Owner cannot be address zero")
        })
      })

      describe("Success Ownership Change", () => {
        it("should succesfully allow owner to change Ownable ownership to new address", async () => {
          const { deployedOwnable, owner, addr1, addr2, ZERO_ADDRESS } = await loadFixture(deployUtil);
        
          await deployedOwnable.connect(owner).changeOwner(addr1) // change owner txn called by owner
          
          let newOwner = await deployedOwnable.getOwner();

          expect(newOwner).to.not.eq(owner)
          expect(newOwner).to.eq(addr1)
          expect(newOwner).to.not.eq(addr2)
          expect(newOwner).to.not.eq(ZERO_ADDRESS)
        })
      })

      describe("Events", () => {
        it("should emit an event when a new address has been given ownership", async () => {
          const { deployedOwnable, owner, addr1 } = await loadFixture(deployUtil);

          await expect(
            deployedOwnable.connect(owner).changeOwner(addr1)
          ).to.emit(deployedOwnable, "ChangeOwner")
          .withArgs(owner, addr1)
        })
      })
    });
  });


