import IDisposable from "./IDisposable";

export default interface IHandler {


    getDefinition(node:HTMLElement): any;





    hasMediator(node:HTMLElement): boolean;



    create(node:HTMLElement, Mediator): IDisposable;

    getAllElements(node:HTMLElement): Array<HTMLElement>;

    destroy(node: HTMLElement): void;

    dispose(): void;
}