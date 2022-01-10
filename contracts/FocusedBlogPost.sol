// contracts/FocusedBlogPost.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FocusedBlogPost is ERC721Enumerable {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct BlogPost {
        string postUri;
        uint256 publishedAt;
        address originalAuthor;
    }

    constructor() ERC721("FocusedBlogPost", "FCSD") {}

    // two weeks in seconds
    uint constant twoWeeks = 60 * 60 * 24 * 14;

    // map of NFT ids to Blog Posts
    mapping(uint256 => BlogPost) public blogPosts;

    function publishBlog(address blogger, string memory postUri)
    public
    returns (uint256)
    {
        _tokenIds.increment();

        uint256 newPostId = _tokenIds.current();
        _mint(blogger, newPostId);

        blogPosts[newPostId] = BlogPost({
        postUri: postUri,
        publishedAt: block.timestamp,
        originalAuthor: blogger
        });

        return newPostId;
    }

    function getCurrentStreak() public view returns (uint) {
        uint streak = 0;
        if (totalSupply() == 0 || totalSupply() == 1) {
            return streak;
        }

        for (uint256 i = totalSupply().sub(1); i > 0; i--) {
            BlogPost memory currentBlog = blogPosts[tokenByIndex(i)];
            BlogPost memory previousBlog = blogPosts[tokenByIndex(i).sub(1)];

            if (currentBlog.publishedAt - previousBlog.publishedAt >= twoWeeks) {
                break;
            }

            streak++;
        }
        return streak;
    }
}
