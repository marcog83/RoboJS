export interface ILoader{
    load(id:string):Promise<any>
}