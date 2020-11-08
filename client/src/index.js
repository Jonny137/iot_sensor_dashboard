import React from 'react';
import ReactDOM from 'react-dom';

import 'typeface-roboto';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
    faThermometerHalf,
    faLightbulb,
    faTint,
    faBatteryThreeQuarters,
    faSignal,
    faCog,
    faLock,
    faRedoAlt,
    faTimes,
    faSyncAlt,
    faBroadcastTower,
    faSignOutAlt,
    faEllipsisV,
    faPen,
    faPlus
} from '@fortawesome/free-solid-svg-icons';

import Main from './Components/Main/Main';

library.add(faThermometerHalf);
library.add(faLightbulb);
library.add(faTint);
library.add(faBatteryThreeQuarters);
library.add(faSignal);
library.add(faCog);
library.add(faLock);
library.add(faRedoAlt);
library.add(faTimes);
library.add(faSyncAlt);
library.add(faBroadcastTower);
library.add(faSignOutAlt);
library.add(faEllipsisV);
library.add(faPen);
library.add(faPlus);

function App() {
    return <Main />;
}

ReactDOM.render(<App />, document.querySelector('#root'));
