export default interface ISignal {
    connect(slot: Function, scope?: any): void;

    connectOnce(slot: Function, scope?: any): void;

    emit(...args: any[]): void;

    disconnect(slot: Function, scope?: any): void;

    disconnectAll(): void;
}
