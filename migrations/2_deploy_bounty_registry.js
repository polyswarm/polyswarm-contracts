const NectarToken = artifacts.require('NectarToken');
const BountyRegistry = artifacts.require('BountyRegistry');

module.exports = function(deployer, network, accounts) {
  return deployer.deploy(NectarToken).then(() => {
    return deployer.deploy(BountyRegistry, NectarToken.address);
  });
};
