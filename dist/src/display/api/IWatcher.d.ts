import {ISignal} from "../../events/api/ISignal";

export  interface IWatcher {
    onAdded: ISignal;
    onRemoved: ISignal;
    dispose(): void;
}