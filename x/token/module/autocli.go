package token

import (
	autocliv1 "cosmossdk.io/api/cosmos/autocli/v1"

	"leochain/x/token/types"
)

// AutoCLIOptions implements the autocli.HasAutoCLIConfig interface.
func (am AppModule) AutoCLIOptions() *autocliv1.ModuleOptions {
	return &autocliv1.ModuleOptions{
		Query: &autocliv1.ServiceCommandDescriptor{
			Service: types.Query_serviceDesc.ServiceName,
			RpcCommandOptions: []*autocliv1.RpcCommandOptions{
				{
					RpcMethod: "Params",
					Use:       "params",
					Short:     "Shows the parameters of the module",
				},
				{
					RpcMethod:      "Balance",
					Use:            "balance [address] [denom]",
					Short:          "Query balance",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "address"}, {ProtoField: "denom"}},
				},

				// this line is used by ignite scaffolding # autocli/query
			},
		},
		Tx: &autocliv1.ServiceCommandDescriptor{
			Service:              types.Msg_serviceDesc.ServiceName,
			EnhanceCustomCommand: true, // only required if you want to use the custom command
			RpcCommandOptions: []*autocliv1.RpcCommandOptions{
				{
					RpcMethod: "UpdateParams",
					Skip:      true, // skipped because authority gated
				},
				{
					RpcMethod:      "Mint",
					Use:            "mint [amount] [denom]",
					Short:          "Send a mint tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "amount"}, {ProtoField: "denom"}},
				},
				{
					RpcMethod:      "Transfer",
					Use:            "transfer [amount] [denom] [receiver]",
					Short:          "Send a transfer tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "amount"}, {ProtoField: "denom"}, {ProtoField: "receiver"}},
				},
				// this line is used by ignite scaffolding # autocli/tx
			},
		},
	}
}
