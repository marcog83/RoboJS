import {IDisposable} from "./IDisposable";

export interface IHandler {


    getDefinition(node: HTMLElement): any;


    hasMediator(node: HTMLElement): boolean;


    create(node: HTMLElement, Mediator): IDisposable;

    getAllElements(node: HTMLElement): Element[];

    destroy(node: HTMLElement): void;

    dispose(): void;
}