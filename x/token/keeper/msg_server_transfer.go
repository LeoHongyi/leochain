package keeper

import (
	"context"

	"leochain/x/token/types"

	errorsmod "cosmossdk.io/errors"
	sdkmath "cosmossdk.io/math"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

func (k msgServer) Transfer(ctx context.Context, msg *types.MsgTransfer) (*types.MsgTransferResponse, error) {
	senderAddr, err := k.addressCodec.StringToBytes(msg.Sender)
	if err != nil {
		return nil, errorsmod.Wrap(err, "invalid sender address")
	}

	receiverAddr, err := k.addressCodec.StringToBytes(msg.Receiver)
	if err != nil {
		return nil, errorsmod.Wrap(err, "invalid receiver address")
	}

	// Create coins to transfer
	coins := sdk.NewCoins(sdk.NewCoin(msg.Denom, sdkmath.NewIntFromUint64(msg.Amount)))

	// Send coins from sender to receiver
	if err := k.bankKeeper.SendCoins(ctx, sdk.AccAddress(senderAddr), sdk.AccAddress(receiverAddr), coins); err != nil {
		return nil, errorsmod.Wrap(err, "failed to transfer coins")
	}

	return &types.MsgTransferResponse{}, nil
}
