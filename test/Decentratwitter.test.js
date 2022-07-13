const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Decentratwitter", function () {
    let decentratwitter
    let deployer, user1, user2, users
    let URI = "SampleURI"
    let postHash = "SampleHash"
    beforeEach(async () => {
      // Get signers from development accounts 
      [deployer, user1, user2, ...users] = await ethers.getSigners();
      // We get the contract factory to deploy the contract
      const DecentratwitterFactory = await ethers.getContractFactory("Decentratwitter");
      // Deploy contract
      decentratwitter = await DecentratwitterFactory.deploy();
      // user1 mints an nfts 
      await decentratwitter.connect(user1).mint(URI)
    })
    
    describe('Deployment', async () => {
      it("Should track name and symbol", async function () {
        const nftName = "Decentratwitter"
        const nftSymbol = "DAPP"
        expect(await decentratwitter.name()).to.equal(nftName);
        expect(await decentratwitter.symbol()).to.equal(nftSymbol);
      });
    })

    describe('Minting NFTs', async () => {
        it('Should track each minted NFT', async function () {
            expect(await decentratwitter.tokenCount()).to.equal(1);
            expect(await decentratwitter.balanceOf(user1.address)).to.equal(1);
            expect(await decentratwitter.tokenURI(1)).to.equal(URI);
            // user2 mints an nft
            await decentratwitter.connect(user2).mint(URI)
            expect(await decentratwitter.tokenCount()).to.equal(2);
            expect(await decentratwitter.balanceOf(user2.address)).to.equal(1);
            expect(await decentratwitter.tokenURI(2)).to.equal(URI);
        });
    })

    describe('Setting Profiles', async () => {
        it("Should allow users to select which NFT they own to represent their profile", async function () {
            // user1 mints another nft
            await decentratwitter.connect(user1).mint(URI)
            // By default the users profile is set to their last minted nft.
            expect(await decentratwitter.profiles(user1.address)).to.equal(2);
            // user 1 sets profile to first minted nft
            await decentratwitter.connect(user1).setProfile(1)
            expect(await decentratwitter.profiles(user1.address)).to.equal(1);
            // FAIL CASE //
            // user 2 tries to set their profile to nft number 2 owned by user 1
            await expect(
              decentratwitter.connect(user2).setProfile(2)
            ).to.be.revertedWith("Must own the nft you want to select as your profile");
          });
    })

    describe('Tipping post', async () => {
        it("Should allow users to tip posts and track each posts tip amount", async function () {
            // user1 uploads a post
            await decentratwitter.connect(user1).uploadPost(postHash)
            // track user1 balance before their post gets tipped
            const initAuthorBalance = await ethers.provider.getBalance(user1.address)
            // set tip amount to 1 ether
            const tipAmount = ethers.utils.parseEther("1")
            //user 2 tips user1's post
            await expect(decentratwitter.connect(user2).tipPostOwner(1, {value: tipAmount}))
                .to.emit(decentratwitter, "PostTipped")
                .withArgs(
                    1,
                    postHash,
                    tipAmount,
                    user1.address
                )
                // check that tipAmount has been updated from struct
                const post = await decentratwitter.posts(1)
                expect(post.tipAmount).to.equal(tipAmount)
                // check that user1 received funds
                const finalAuthBalance = await ethers.provider.getBalance(user1.address)
                expect(finalAuthBalance).to.equal(initAuthorBalance.add(tipAmount))
                // Fail case 1
                // user 2 tries to tip post that does not exist
                await expect(
                    decentratwitter.connect(user2).tipPostOwner(2)
                ).to.be.revertedWith("Invalid post id");
                // user 1 tries to tip their own post
                await expect(
                    decentratwitter.connect(user1).tipPostOwner(1)
                ).to.be.revertedWith("Cannot tip your own post");
        })
    })
});
