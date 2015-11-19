import Omni = require("../../lib/omni-sharp-server/omni");
import {Observable, CompositeDisposable} from "rx";
import {setupFeature, restoreBuffers, openEditor} from "../test-helpers";
import {codeLens} from "../../lib/omnisharp-atom/features/code-lens";

describe("Highlight", () => {
    setupFeature(["features/highlight"]);

});
