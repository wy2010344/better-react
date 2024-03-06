import { dom } from "better-react-dom";
import { useEffect } from "better-react-helper";
import { emptyArray } from "wy-helper";
import { DBConfig, getIndexedDB } from "./config";

const DBNAME = "learn"
export default function () {


  useEffect(() => {


    const config: DBConfig = {
      name: "learn",
      upgradeneeded: [
        function (idbReq) {
          const objectStore = idbReq.result.createObjectStore("customers", { keyPath: "ssn" });
          const objectStore1 = idbReq.result.createObjectStore("customers1", { keyPath: "ssn" });
          objectStore.createIndex("name", "name", { unique: false });
          objectStore1.createIndex("name", "name", { unique: false });
          const customerData = [
            { ssn: "444-44-4444", name: "Bill", age: 35, email: "bill@company.com" },
            { ssn: "555-55-5555", name: "Donna", age: 32, email: "donn@home.org" },
          ];
          customerData.forEach((customer) => {
            objectStore.add(customer);
          });
        },
        function (idbReq) {
          const objectStore1 = idbReq.transaction.objectStore('customers1')
          const customerData = [
            { ssn: "444-44-4444", name: "Bill", age: 35, email: "bill@company.com" },
            { ssn: "555-55-5555", name: "Donna", age: 32, email: "donn@home.org" },
          ];
          customerData.forEach((customer) => {
            objectStore1.add(customer);
          });
        },
        function (idbReq) {
          idbReq.result.deleteObjectStore("customers1")
        }
      ]
    }
    getIndexedDB(config)
  }, emptyArray)
  dom.div().render(function () {
    dom.h1().renderText`indexDB`
  })
}