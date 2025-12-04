package keeper

import (
	"context"

	"leochain/x/token/types"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (q queryServer) Balance(ctx context.Context, req *types.QueryBalanceRequest) (*types.QueryBalanceResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	addr, err := q.k.addressCodec.StringToBytes(req.Address)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid address")
	}

	balance := q.k.bankKeeper.GetBalance(ctx, sdk.AccAddress(addr), req.Denom)

	return &types.QueryBalanceResponse{
		Balance: balance.Amount.String(),
	}, nil
}
