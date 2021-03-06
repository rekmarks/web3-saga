
// import { createSelector } from 'reselect'

const selectWeb3 = state => state.web3
const selectContracts = state => state.contracts
const selectContractTypes = state => state.contracts.types

export default {
  web3: selectWeb3,
  contracts: selectContracts,
  contractTypes: selectContractTypes,
}

// FUTURE
// const getAccount = state => state.web3.account
// const getNetworkId = state => state.web3.networkId
// const getContractInstances = state => state.contracts.instances
//
// export const selectContractInstances = createSelector(
//   [getAccount, getNetworkId, getContractInstances],
//   (account, networkId, instances) =>
//     Object.values(instances)
//       .filter(i => {
//           return i.account === account && i.networkId === networkId
//       })
//       .reduce((acc, i) => {
//           acc[i.id] = i
//           return acc
//       }, {})
// )
