"use strict";var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports,"__esModule",{value:!0}),exports.sagas=exports.reducers=exports.initialState=void 0;var _toConsumableArray2=_interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray")),_objectSpread2=_interopRequireDefault(require("@babel/runtime/helpers/objectSpread")),_contracts=require("./reducers/contracts"),_web=require("./reducers/web3"),initialState={contracts:(0,_objectSpread2.default)({},_contracts.initialState),web3:(0,_objectSpread2.default)({},_web.initialState)};exports.initialState=initialState;var reducers={contracts:_contracts.reducer,// these will be reducer keys in the target
web3:_web.reducer};exports.reducers=reducers;var sagas=[].concat((0,_toConsumableArray2.default)(_web.sagas),(0,_toConsumableArray2.default)(_contracts.sagas));exports.sagas=sagas;
//# sourceMappingURL=index.js.map