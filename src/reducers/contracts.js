
// package imports

import { call, put, select, takeLeading } from 'redux-saga/effects'

import uuidv4 from 'uuid/v4'
import uuidv5 from 'uuid/v5'

import {
  deploy as _deploy,
  // v2.0
  // getInstance,
  // callInstance,
} from 'chain-end'

// local imports

import { contracts as ACTIONS } from '../actions'
import selectors from '../selectors'

// contract type uuids are created using the contract bytecode
// think of the resulting uuid as a hash of the contract artifact to help
// prevent the addition of duplicate contracts
// e.g.     const id = uuidv5(c.bytecode, NAMESPACE)
import { NAMESPACE } from '../utils'

const initialState = {

  types: {
    // id: {
    //   id,
    //   name, (artifact.contractName)
    //   artifact,
    // }
  },

  // error storage
  errors: [],

  // prevents further web3 calls if false
  isDeploying: false,

  // deployed contract instances
  instances: {
    // id: {
    //   id,
    //   truffleContract,
    //   address,
    //   account,
    //   type,
    //   constructorParams,
    //   networkId,
    //   dappTemplateIds,
    //   templateNodeId,
    // }
  },

  // v2.0
  // // contract instance call storage
  // callHistory: [],

  // v3.0
  // // used when deploying dapps
  // deploymentQueue: null,
}

const sagas = [
 takeLeading(ACTIONS.BEGIN_DEPLOYMENT, deploySaga),
]

const _test = {
  actions: {
    getClearErrorsAction,
    getBeginDeploymentAction,
    getDeploymentFailureAction,
    getDeploymentSuccessAction,
    getAddContractTypeAction,
    getRemoveContractTypeAction,
  },
  sagas: {
    deploySaga,
    watchDeploySaga,
  },
  fn: {
    deployContract,
    prepareForDeployment,
  },
}

export {
  // actions
  getBeginDeploymentAction as deployContract,
  getClearErrorsAction as clearErrors,
  getAddContractTypeAction as addContractType,
  getRemoveContractTypeAction as removeContractType,
  // general
  initialState,
  addInitialContractType,
  sagas,
  _test,
}

/**
 * Initialization Helpers
 */

/**
 * Adds the given artifact to initialState as a contract type.
 * WARNING: Only use this to add contracts to the initial state of the
 * contracts reducer. Use the reducer after initialization.
 * @param {object} initialState the initial state of the contracts reducer
 * @param {object} artifact a compiled Solidity artifact
 */
function addInitialContractType (initialState, artifact) {

  const id = uuidv5(artifact.bytecode, NAMESPACE)

  initialState.types[id] = {
    id,
    name: artifact.contractName,
    artifact,
  }
}

/**
 * Reducer
 */

export function reducer (state = initialState, action) {

  switch (action.type) {

    case ACTIONS.BEGIN_DEPLOYMENT:
      return {
        ...state,
        isDeploying: true,
      }

    case ACTIONS.END_DEPLOYMENT:
      return {
        ...state,
        isDeploying: false,
      }

    case ACTIONS.ADD_CONTRACT_TYPE:

      return {

        ...state,
        types: {

          ...state.types,

          [action.id]: {
            id: action.id,
            name: action.artifact.contractName,
            artifact: action.artifact,
          },
        },
      }

    case ACTIONS.REMOVE_CONTRACT_TYPE:

      const types = Object.values(state.types).reduce((acc, t) => {
        if (t.id !== action.id) acc[t.id] = t
        return acc
      }, {})

      return {
        ...state,
        types,
      }

    case ACTIONS.DEPLOYMENT_SUCCESS:

      return {
        ...state,

        instances: {
          ...state.instances,

          [action.id]: {
            ...action.data,
            id: action.id,
            // dappTemplateIds: action.data.dappTemplateIds || [],
          },
        },
        isDeploying: false,
      }

    case ACTIONS.DEPLOYMENT_FAILURE:
      return {
        ...state,
        errors: state.errors.concat(action.error),
        isDeploying: false,
      }

    case ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        errors: [],
      }

    default:
      return state
  }
}

/**
 * Synchronous action creators
 */

/**
 * Adds the contract artifact to state.
 * NOTE: Overwrites anything with the same id (i.e. if adding
 * artifacts with identical bytecode).
 * @param {object} artifact the compiled contract artifact
 */
function getAddContractTypeAction (artifact) {
  return {
    type: ACTIONS.ADD_CONTRACT_TYPE,
    id: uuidv5(artifact.bytecode, NAMESPACE),
    artifact,
  }
}

/**
 * Removes contract type from state.
 * WARNING: Any functionality relying on the existence of this contract type
 * will stop working.
 * @param {string} id id of contract type to remove
 */
function getRemoveContractTypeAction (id) {
  return {
    type: ACTIONS.REMOVE_CONTRACT_TYPE,
    id,
  }
}

/**
 * Initializes contract deployment.
 * @param {string} contractId the uuid of the contract to deploy
 * @param {array} constructorParams the parameters, in the order they must be
 * passed to the constructor, or an object
 */
function getBeginDeploymentAction (contractId, constructorParams) {
  return {
    type: ACTIONS.BEGIN_DEPLOYMENT,
    contractId,
    constructorParams,
  }
}

function getDeploymentSuccessAction (id, data) {
  return {
    type: ACTIONS.DEPLOYMENT_SUCCESS,
    id,
    data,
  }
}

function getDeploymentFailureAction (error) {
  return {
    type: ACTIONS.DEPLOYMENT_FAILURE,
    error,
  }
}

function getClearErrorsAction () {
  return {
    type: ACTIONS.CLEAR_ERRORS,
  }
}

/**
 * Sagas
 */

/**
 * Watcher for deploySaga.
 */
function * watchDeploySaga () {
  yield takeLeading(ACTIONS.BEGIN_DEPLOYMENT, deploySaga)
}

/**
 * Attempts to deploy the given contract by calling its constructor with the
 * given parameters. Handles success and failure.
 * @param {object} action the action initializing the deployment procedure
 */
function * deploySaga (action) {

  // get necessary substate
  const web3 = yield select(selectors.web3)
  const contracts = yield select(selectors.contracts)

  let ready = false
  try { ready = prepareForDeployment(web3) } catch (error) {
    yield put(getDeploymentFailureAction(error))
  }

  if (ready) {
    try {
      const result = yield call(
        deployContract,
        web3.account,
        web3.networkId,
        contracts.types,
        action.contractId,
        action.constructorParams
      )
      yield put(getDeploymentSuccessAction(uuidv4(), result))
    } catch (error) {
      yield put(getDeploymentFailureAction(error))
    }
  }
}

/**
 * Internal helpers
 */

/**
 * Validates pre-deployment state. Throws error if validation fails.
 * Returns true otherwise.
 *
 * @param {object} web3 redux web3 substate
 * @return {bool} true if validation successful, else throws
 */
function prepareForDeployment (web3) {

  if (!web3.ready) {
    throw new Error('Reducer "web3" not ready.')
  }
  if (!web3.networkId) {
    throw new Error('Missing web3 networkId.')
  }
  if (!web3.account) {
    throw new Error('Missing web3 account.')
  }
  return true
}

/**
 * Helper performing actual deployment work.
 * Validates that the contract's artifact exists and that the web3 call is
 * successful.
 *
 * @param {object} web3 redux web3 substate
 * @param {object} contractTypes contract types from state
 * @param {string} contractId name of contract to deploy
 * @param {array} constructorParams constructor parameters as array of
 * { order, value } objects
 * @return {object} deployment data if successful, throws otherwise
 */
async function deployContract (
    account,
    networkId,
    contractTypes,
    contractId,
    constructorParams,
  ) {

  // validation
  if (!contractTypes[contractId]) {
    throw new Error('No contract with id "' + contractId + '" found.')
  }

  // actual web3 call happens in here
  // this may throw and that's fine
  const instance = await _deploy(
    contractTypes[contractId].artifact,
    // create sorted array of param values
    constructorParams
      .sort((a, b) => a.order - b.order)
      .map(param => param.value),
    window.ethereum,
    account
  )

  // success, return deployment data
  return {
    instance: instance,
    address: instance.address,
    account: account,
    type: contractTypes[contractId].name,
    constructorParams: constructorParams,
    networkId: networkId,
  }
}
