import {join} from "path";
import {readFileSync} from "fs";

module.exports = function(
    {testPaths, buildAtomEnvironment, buildDefaultApplicationDelegate}: {
        testPaths: string[];
        buildAtomEnvironment: (opts: any) => Atom.Atom;
        applicationDelegate: any;
        window: Window;
        document: Document;
        enablePersistence: boolean;
        buildDefaultApplicationDelegate: any;
        logFile: string;
        headless: boolean
    }): Promise<number> {
    console.log(testPaths);
    const fixtures = testPaths.map(x => join(x, "fixtures"));

    const applicationDelegate = buildDefaultApplicationDelegate();

    applicationDelegate.setRepresentedFilename = () => {/* */ };
    applicationDelegate.setWindowDocumentEdited = () => {/* */ };

    const mochaCtor: typeof Mocha = require("mocha");
    const globby: (paths: string[]) => Promise<string[]> = require("globby");

    const atom = buildAtomEnvironment({
        applicationDelegate: applicationDelegate,
        window, document,
        configDirPath: process.env.ATOM_HOME,
        enablePersistence: false
    });

    (<any>window).atom = atom;

    //const atomDiv = document.createElement("div");
    //atomDiv.style.display = "none";
    //document.body.appendChild(atomDiv);
    //atomDiv.appendChild(atom.views.getView(atom.workspace));

    const mochaDiv = document.createElement("div");
    mochaDiv.id = "mocha";
    document.body.appendChild(mochaDiv);

    const mochaCss = document.createElement("style");
    mochaCss.innerHTML = `html, body { overflow: inherit; }\n` + readFileSync(join(__dirname, "..", "node_modules", "mocha", "mocha.css")).toString();
    document.head.appendChild(mochaCss);

    const mocha = new mochaCtor({
        ui: "bdd",
        reporter: "html",
        timeout: 30000
    });

    (<any>mocha).suite.beforeEach(() => {
        process.chdir(fixtures[0]);
        atom.project.setPaths(<any>fixtures);
    });

    (<any>mocha).suite.afterEach(() => {
        atom.packages.deactivatePackages();
    });

    return Promise.all(testPaths.map(path => globby([join(path, "**/*-spec.js")])))
        .then((paths) => {
            paths.forEach(fs => fs.forEach(f => mocha.addFile(f)));

            return new Promise<number>(resolve => mocha.run(resolve));
        });
};
