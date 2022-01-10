import { ethers, network } from "hardhat";
// eslint-disable-next-line camelcase
import { FocusedBlogPost__factory } from "../typechain";
import { expect } from "chai";
import { getCurrentTimestamp } from "hardhat/internal/hardhat-network/provider/utils/getCurrentTimestamp";

const TWO_WEEKS = 60 * 60 * 24 * 14 - 1;

describe("FocusedBlogPost.sol", function () {
  beforeEach(async () => {
    await network.provider.send("hardhat_reset");
  });

  describe("#publishBlog", () => {
    it("mints an NFT for the author", async function () {
      const contractFactory = (await ethers.getContractFactory(
        "FocusedBlogPost"
      )) as FocusedBlogPost__factory;
      const contract = await contractFactory.deploy();
      await contract.deployed();

      const signerWithAddress = (await ethers.getSigners())[0];

      await contract.publishBlog(
        signerWithAddress.address,
        "https://example.com"
      );

      expect(await contract.balanceOf(signerWithAddress.address)).to.equal(1);
    });

    it("creates a blog post for the NFT", async () => {
      const contractFactory = (await ethers.getContractFactory(
        "FocusedBlogPost"
      )) as FocusedBlogPost__factory;
      const contract = await contractFactory.deploy();
      await contract.deployed();

      const signerWithAddress = (await ethers.getSigners())[0];
      const firstPostTime = getCurrentTimestamp() + 1;

      await network.provider.send("evm_setNextBlockTimestamp", [firstPostTime]);

      await contract.publishBlog(
        signerWithAddress.address,
        "https://example.com"
      );

      const tokenId = await contract.tokenOfOwnerByIndex(
        signerWithAddress.address,
        0
      );

      const post = await contract.blogPosts(tokenId);

      expect(post.postUri).to.equal("https://example.com");
      expect(post.originalAuthor).to.equal(signerWithAddress.address);
      expect(post.publishedAt).to.equal(firstPostTime);
    });
  });

  describe("#getCurrentStreak", () => {
    it("returns zero if there are no blog posts", async () => {
      const contractFactory = (await ethers.getContractFactory(
        "FocusedBlogPost"
      )) as FocusedBlogPost__factory;
      const contract = await contractFactory.deploy();
      await contract.deployed();

      expect(await contract.getCurrentStreak()).to.equal(0);
    });

    it("returns zero if the next most recent post is more than two weeks in the past", async () => {
      const contractFactory = (await ethers.getContractFactory(
        "FocusedBlogPost"
      )) as FocusedBlogPost__factory;
      const contract = await contractFactory.deploy();
      await contract.deployed();
      const signerWithAddress = (await ethers.getSigners())[0];

      await contract.publishBlog(
        signerWithAddress.address,
        "https://example.com"
      );

      expect(await contract.getCurrentStreak()).to.equal(0);
    });

    it("returns 1 with two blogs within two weeks of eachother", async () => {
      const contractFactory = (await ethers.getContractFactory(
        "FocusedBlogPost"
      )) as FocusedBlogPost__factory;
      const contract = await contractFactory.deploy();
      await contract.deployed();
      const signerWithAddress = (await ethers.getSigners())[0];
      const firstPostTime = getCurrentTimestamp() + 1;
      await network.provider.send("evm_setNextBlockTimestamp", [firstPostTime]);

      await contract.publishBlog(
        signerWithAddress.address,
        "https://example.com"
      );

      await network.provider.send("evm_increaseTime", [TWO_WEEKS]);

      await contract.publishBlog(
        signerWithAddress.address,
        "https://example.com"
      );

      expect(await contract.getCurrentStreak()).to.equal(1);
    });

    it("returns 2 with a 2 week streak", async () => {
      const contractFactory = (await ethers.getContractFactory(
        "FocusedBlogPost"
      )) as FocusedBlogPost__factory;
      const contract = await contractFactory.deploy();
      await contract.deployed();
      const signerWithAddress = (await ethers.getSigners())[0];
      const firstPostTime = getCurrentTimestamp() + 1;

      await network.provider.send("evm_setNextBlockTimestamp", [firstPostTime]);

      await contract.publishBlog(
        signerWithAddress.address,
        "https://example.com"
      );

      await network.provider.send("evm_increaseTime", [TWO_WEEKS]);

      await contract.publishBlog(
        signerWithAddress.address,
        "https://example.com"
      );

      await network.provider.send("evm_increaseTime", [TWO_WEEKS]);

      await contract.publishBlog(
        signerWithAddress.address,
        "https://example.com"
      );

      expect(await contract.getCurrentStreak()).to.equal(2);
    });

    it("returns breaks the streak", async () => {
      const contractFactory = (await ethers.getContractFactory(
        "FocusedBlogPost"
      )) as FocusedBlogPost__factory;
      const contract = await contractFactory.deploy();
      await contract.deployed();
      const signerWithAddress = (await ethers.getSigners())[0];
      const firstPostTime = getCurrentTimestamp() + 1;

      await network.provider.send("evm_setNextBlockTimestamp", [firstPostTime]);

      await contract.publishBlog(
        signerWithAddress.address,
        "https://example.com"
      );

      await network.provider.send("evm_increaseTime", [TWO_WEEKS]);

      await contract.publishBlog(
        signerWithAddress.address,
        "https://example.com"
      );

      // Post just after two weeks
      await network.provider.send("evm_increaseTime", [TWO_WEEKS + 1]);

      await contract.publishBlog(
        signerWithAddress.address,
        "https://example.com"
      );

      expect(await contract.getCurrentStreak()).to.equal(0);

      await network.provider.send("evm_increaseTime", [TWO_WEEKS]);

      await contract.publishBlog(
        signerWithAddress.address,
        "https://example.com"
      );

      expect(await contract.getCurrentStreak()).to.equal(1);

      await network.provider.send("evm_increaseTime", [TWO_WEEKS]);

      await contract.publishBlog(
        signerWithAddress.address,
        "https://example.com"
      );
      await network.provider.send("evm_increaseTime", [TWO_WEEKS]);

      await contract.publishBlog(
        signerWithAddress.address,
        "https://example.com"
      );

      expect(await contract.getCurrentStreak()).to.equal(3);
    });
  });
});
