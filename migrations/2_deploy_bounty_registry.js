const NectarToken = artifacts.require('NectarToken');
const BountyRegistry = artifacts.require('BountyRegistry');

module.exports = function(deployer, network, accounts) {
  deployer.deploy(NectarToken).then(() => {
    deployer.deploy(BountyRegistry, NectarToken.address);
  });
};
