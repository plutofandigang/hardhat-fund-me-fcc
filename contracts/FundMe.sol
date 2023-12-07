// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PriceConverter.sol";

error FundMe_NotOwner();

/* 
@title A contract for crowd funding.
@author Pluto Yang
@notice This contract is for the purpose of learning solidity.
@dev This implements price feeds as our library.
 */
contract FundMe {
	using PriceConverter for uint256;

	uint256 public constant MINIMUM_USD = 50 * 10e18;
	address[] public funders;
	mapping(address => uint) public addressToAmountFounded;
	address public immutable i_owner;
	AggregatorV3Interface public priceFeed;

	modifier onlyOwner() {
		if (msg.sender != i_owner) revert FundMe_NotOwner();
		_;
	}

	constructor(address priceFeedAddress) {
		i_owner = msg.sender;
		priceFeed = AggregatorV3Interface(priceFeedAddress);
	}

	receive() external payable {
		fund();
	}

	fallback() external payable {
		fund();
	}

	/* 
@notice This contract is for funding .
@dev This implements price feeds as our library.
@ prama or return???
 */
	function fund() public payable {
		require(
			msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,
			"You need to send at least 50 USD"
		);
		funders.push(msg.sender);
		addressToAmountFounded[msg.sender] += msg.value;
	}

	function withdraw() public onlyOwner {
		funders = new address[](0);
		(bool callSuccess, ) = payable(msg.sender).call{
			value: address(this).balance
		}("");
		require(callSuccess, "Call Failed");
	}
}
