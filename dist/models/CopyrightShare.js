"use strict";
/**
 * 版权份额模型（用户持有的版权份额）
 * 按1份为单位存储，每个份额对应一个区块链hash
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const CopyrightShareSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    copyrightId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Copyright',
        required: true,
        index: true
    },
    blockchainHash: {
        type: String,
        required: true,
        unique: true, // 每个区块链hash唯一
        index: true
    },
    inLotteryPool: {
        type: Boolean,
        default: false
    },
    lastGiftDate: {
        type: Date
    },
    giftCount: {
        type: Number,
        default: 0,
        min: 0,
        max: 3
    }
}, {
    timestamps: true
});
// 复合索引：用户和版权的组合查询
CopyrightShareSchema.index({ userId: 1, copyrightId: 1 });
exports.default = mongoose_1.default.model('CopyrightShare', CopyrightShareSchema);
