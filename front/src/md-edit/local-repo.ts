import { type IRevRepo } from "./i-rev-repo";

export class LocalRevRepo implements IRevRepo {
	// ...
	isConnected(): boolean {
		return true;
	}
}
