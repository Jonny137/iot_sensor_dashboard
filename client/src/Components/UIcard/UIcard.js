import React from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import CardActionArea from '@material-ui/core/CardActionArea';
import Tooltip from '@material-ui/core/Tooltip';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import './UIcard.css';

export default class UIcard extends React.Component {

    checkThreshold() {
        return (this.props.icon === 'lock' && this.props.value === 1) || 
               (this.props.threshold &&
               ((!this.props.threshold.value.disabledMax && this.props.value > this.props.threshold.value.max) || 
                (!this.props.threshold.value.disabledMin && this.props.value < this.props.threshold.value.min)))
    }

    checkCharge() {
        if (this.props.title === 'Battery') {
            return this.props.charge >= 0 ? ` (${this.props.charge}%)` : ' (0%)';
        } else {
            return '';
        }
    }

    render() {
        return (
            <Tooltip title={`Click to reveal ${this.props.title} history data`}>
                <Card className={this.checkThreshold() ? "ui-card__pulse" : "ui-card"} variant="outlined">
                    <CardActionArea onClick={() => this.props.cardClick(this.props.deviceName, this.props.unit)}>
                        <CardContent>
                            <FontAwesomeIcon className={this.checkThreshold() ? "ui-card__icon-colored" : "ui-card__icon"} icon={this.props.icon} />
                            <div className="ui-card__content">
                                <Typography variant="h5" className={this.checkThreshold() ? "ui-card__info-colored" : "ui-card__info"}>
                                    {this.props.value + this.props.unit + this.checkCharge()}
                                </Typography>
                                <Typography variant="subtitle1" className={this.checkThreshold() ? "ui-card__title-colored" : "ui-card__title"}>
                                    {this.props.title}
                                </Typography>
                            </div>
                        </CardContent>
                    </CardActionArea>
                </Card>
            </Tooltip>
        );
    }
}
