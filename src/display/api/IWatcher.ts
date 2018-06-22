import ISignal from "../../events/api/ISignal";

export default interface IWatcher {
    onAdded: ISignal;
    onRemoved: ISignal;
    dispose(): void;
}