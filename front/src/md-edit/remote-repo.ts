import { type IRevRepo } from "./i-rev-repo";

export class RemoteRevRepo implements IRevRepo {
	// ...
	isConnected(): boolean {
		throw new Error("Method not implemented.");
	}
}
