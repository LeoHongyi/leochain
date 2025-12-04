package keeper

import (
	"context"

	"leochain/x/token/types"

	errorsmod "cosmossdk.io/errors"
	sdkmath "cosmossdk.io/math"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

func (k msgServer) Mint(ctx context.Context, msg *types.MsgMint) (*types.MsgMintResponse, error) {
	creatorAddr, err := k.addressCodec.StringToBytes(msg.Creator)
	if err != nil {
		return nil, errorsmod.Wrap(err, "invalid creator address")
	}

	// Create coins to mint
	coins := sdk.NewCoins(sdk.NewCoin(msg.Denom, sdkmath.NewIntFromUint64(msg.Amount)))

	// Mint coins to the module account
	if err := k.bankKeeper.MintCoins(ctx, types.ModuleName, coins); err != nil {
		return nil, errorsmod.Wrap(err, "failed to mint coins")
	}

	// Send coins from module to creator
	if err := k.bankKeeper.SendCoinsFromModuleToAccount(ctx, types.ModuleName, sdk.AccAddress(creatorAddr), coins); err != nil {
		return nil, errorsmod.Wrap(err, "failed to send coins from module to account")
	}

	return &types.MsgMintResponse{}, nil
}
