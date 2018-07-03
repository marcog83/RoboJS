/**
 * Created by marco.gobbi on 21/01/2015.
 */
import {EventTarget} from "../../events/impl/EventTarget";
import {IHandler} from "../api/IHandler";
import {IDisposable} from "../api/IDisposable";


export class AHandler implements IHandler {
    definitions: {};
    dispatcher: EventTarget;

    constructor(params) {
        let {definitions = {}, dispatcher = new EventTarget()} = params;
        this.definitions = definitions;
        this.dispatcher = dispatcher;
    }

    getDefinition(node): any {

    }

    inCache(node): boolean {
        return false;
    }

    updateCache(disposable: IDisposable): void {


    }

    hasMediator(node): boolean {
        return false;
    }


    create(node: HTMLElement, Mediator): IDisposable {
        throw new Error("not implemented");
    }

    getAllElements(node: HTMLElement): Array<Element> {
        throw new Error("not implemented");
    }


    /**
     *
     * @param node
     */

    destroy(node: HTMLElement): void {

    }

    dispose(): void {


    }
}


