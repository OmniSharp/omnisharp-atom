import _ = require('lodash');
import {Observable} from 'rx';
import {OmnisharpObservationClient, OmnisharpCombinationClient} from "omnisharp-client";
import Client = require("./client");

export class ObservationClient extends OmnisharpObservationClient<Client> { }
export class CombinationClient extends OmnisharpCombinationClient<Client> { }
