import ether from './helpers/ether';
import advanceToBlock, { advanceBlock, advanceBlocks } from './helpers/advanceToBlock';
import EVMRevert from './helpers/EVMRevert';
import utils from 'ethereumjs-util';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ArbiterStaking = artifacts.require('ArbiterStaking');
const NectarToken = artifacts.require('NectarToken');

// From contracts/ArbiterStaking.sol
const STAKE_DURATION = 100;
const MINIMUM_STAKE = 10000000 * 10 ** 18;     

contract('ArbiterStaking', function ([owner, arbiter]) {
  before(async function () {
    // Advance to the max stake duration so the subtraction in
    // withdrawableBalanceOf and withdraw doesn't revert()
    await advanceBlocks(STAKE_DURATION);
  });

  beforeEach(async function () {
    this.token = await NectarToken.new();

    await [arbiter].forEach(async account => {
      await this.token.mint(account, ether(1000));
    });

    await this.token.enableTransfers();

    this.staking = await ArbiterStaking.new(this.token.address, STAKE_DURATION);
  });

  describe('lifecycle', function() {
    it('should be owned', async function() {
      let o = await this.staking.owner();
      o.should.be.equal(owner);
    });

    it('should be pausable', async function() {
      await this.staking.pause();
      await this.staking.deposit('1', { from: arbiter }).should.be.rejectedWith(EVMRevert);
      await this.staking.unpause();
      await this.token.approve(this.staking.address, '1', {from: arbiter }).should.be.fulfilled;
      let tx = await this.staking.deposit('1', { from: arbiter }).should.be.fulfilled;
      tx.logs[0].args.from.should.be.bignumber.equal(arbiter);
      tx.logs[0].args.value.should.be.bignumber.equal(1);
    });
  });

  describe('deposits', function() {
    it('should allow deposits', async function() {
      await this.token.approve(this.staking.address, '1', {from: arbiter }).should.be.fulfilled;
      let tx = await this.staking.deposit('1', { from: arbiter }).should.be.fulfilled;
      tx.logs[0].args.from.should.be.bignumber.equal(arbiter);
      tx.logs[0].args.value.should.be.bignumber.equal(1);
    });

    it('update the balance after a deposit', async function() {
      await this.token.approve(this.staking.address, '1', {from: arbiter }).should.be.fulfilled;
      let tx = await this.staking.deposit('1', { from: arbiter }).should.be.fulfilled;
      tx.logs[0].args.from.should.be.bignumber.equal(arbiter);
      tx.logs[0].args.value.should.be.bignumber.equal(1);

      const balance = await this.staking.balanceOf(arbiter);
      balance.should.be.bignumber.equal('1');
    });

    it('update the withdrawable balance after a deposit', async function() {
      await this.token.approve(this.staking.address, '1', {from: arbiter }).should.be.fulfilled;
      let tx = await this.staking.deposit('1', { from: arbiter }).should.be.fulfilled;
      tx.logs[0].args.from.should.be.bignumber.equal(arbiter);
      tx.logs[0].args.value.should.be.bignumber.equal(1);

      await advanceBlocks(10);

      await this.token.approve(this.staking.address, '1', {from: arbiter }).should.be.fulfilled;
      tx = await this.staking.deposit('1', { from: arbiter }).should.be.fulfilled;
      tx.logs[0].args.from.should.be.bignumber.equal(arbiter);
      tx.logs[0].args.value.should.be.bignumber.equal(1);

      let b = await this.staking.balanceOf(arbiter);
      b.should.be.bignumber.equal('2');

      let wb = await this.staking.withdrawableBalanceOf(arbiter);
      wb.should.be.bignumber.equal('0');

      await advanceBlocks(STAKE_DURATION - 10);
      wb = await this.staking.withdrawableBalanceOf(arbiter);
      wb.should.be.bignumber.equal('1');
 
      await advanceBlocks(10);
      wb = await this.staking.withdrawableBalanceOf(arbiter);
      wb.should.be.bignumber.equal('2');
    });
  });

  describe('withdrawals', function() {
    it('should allow withdrawals after the minimum staking time', async function() {
      await this.token.approve(this.staking.address, '1', {from: arbiter }).should.be.fulfilled;
      let tx = await this.staking.deposit('1', { from: arbiter }).should.be.fulfilled;
      tx.logs[0].args.from.should.be.bignumber.equal(arbiter);
      tx.logs[0].args.value.should.be.bignumber.equal(1);

      let b = await this.staking.balanceOf(arbiter);
      b.should.be.bignumber.equal('1');
      let wb = await this.staking.withdrawableBalanceOf(arbiter);
      wb.should.be.bignumber.equal('0');

      await this.staking.withdraw('1', { from: arbiter }).should.be.rejectedWith(EVMRevert);

      await advanceBlocks(STAKE_DURATION);

      b = await this.staking.balanceOf(arbiter);
      b.should.be.bignumber.equal('1');
      wb = await this.staking.withdrawableBalanceOf(arbiter);
      wb.should.be.bignumber.equal('1');

      tx = await this.staking.withdraw('1', { from: arbiter }).should.be.fulfilled;
      tx.logs[0].args.to.should.be.bignumber.equal(arbiter);
      tx.logs[0].args.value.should.be.bignumber.equal(1);

      b = await this.staking.balanceOf(arbiter);
      b.should.be.bignumber.equal('0');
      wb = await this.staking.withdrawableBalanceOf(arbiter);
      wb.should.be.bignumber.equal('0');
    });
  });
});
