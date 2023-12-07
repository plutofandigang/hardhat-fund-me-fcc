const { assert, expect } = require("chai");
const { ethers, network, deployments } = require("hardhat");

describe("FundMe", function () {
	let fundMe;
	let deployer;
	let mockV3Aggregator;
	const sendValue = ethers.utils.parseEther("1");
	beforeEach(async function () {
		// 1.deploy the contract/use hardhat-deploy
		deployer = (await getNamedAccounts()).deployer;
		await deployments.fixture(["all"]);
		fundMe = await ethers.getContractAt("FundMe", deployer);
		mockV3Aggregator = await ethers.getContractAt(
			"MockV3Aggregator",
			deployer
		);
	});
	describe("constructor", async function () {
		it("should set the owner to the deployer", async function () {
			const response = await fundMe.owner();
			assert.equal(response, deployer);
		});
		it("sets the aggregator address correctly", async function () {
			const response = await fundMe.priceFeed();
			assert.equal(response, mockV3Aggregator.address);
		});ß
	});
	describe("fund", async function () {
		it("should send at least 50usd", async function () {
			await expect(fundMe.fund()).to.be.revertedWith(
				"You need to send at least 50 USD"
			);
		});
		it("update the amount funded data structure", async function () {
			await fundMe.fund({ value: sendValue });
			const response = await fundMe.addressToAmountFounded(deployer);
			assert.equal(response.toString(), sendValue.toString());
		});
	});
	describe("withdraw", async function () {
		beforeEach(async function () {
			await fundMe.fund({ value: sendValue });
		});
		it("should withdraw the funds", async function () {
			const beforeWithdrawValue_fundMe = await fundMe.provider.getBalance(
				fundMe.address
			);
			const beforeWithdrawValue_deployer =
				await fundMe.provider.getBalance(deployer);

			const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait();
            const{gasUsed,effectiveGasPrice} = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);

			const afterWithdrawValue_fundMe = await fundMe.provider.getBalance(
				fundMe.address
			);
			const afterWithdrawValue_deployer =
				await fundMe.provider.getBalance(deployer);
			
			assert.equal(afterWithdrawValue_fundMe.toString(), "0");
			assert.equal(
				beforeWithdrawValue_deployer
					.add(beforeWithdrawValue_fundMe)
					.toString(),
				afterWithdrawValue_deployer.add(gasCost).toString()
			);
		});
        it("only allows owner to withdraw",async function (){
            const accounts = await ethers.getSigners();
            const attacker = accounts(1);
            const attackerConnectedContract = await fundMe.connect(attacker);
            await expect(attackerConnectedContract.withdraw()).to.be.revertedWith("FundMe_NotOwner");
        });
	});
});
