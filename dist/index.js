"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sagas = exports.reducers = exports.initialState = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _web = _interopRequireWildcard(require("./reducers/web3"));

var _contracts = _interopRequireWildcard(require("./reducers/contracts"));

// import '@babel/polyfill'
var initialState = {
  contracts: (0, _objectSpread2.default)({}, _contracts.initialState),
  web3: (0, _objectSpread2.default)({}, _web.initialState)
};
exports.initialState = initialState;
var reducers = {
  contractsReducer: _contracts.default,
  web3Reducer: _web.default
};
exports.reducers = reducers;
var sagas = [].concat((0, _toConsumableArray2.default)(_web.sagas), (0, _toConsumableArray2.default)(_contracts.sagas));
exports.sagas = sagas;
//# sourceMappingURL=index.js.map