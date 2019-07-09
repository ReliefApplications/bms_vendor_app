import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
    selector: 'calculator',
    templateUrl: 'calculator.html'
})
export class CalculatorComponent implements OnInit {

    @Input() value: number;
    @Output() valueChange = new EventEmitter<number>();

    public valueString;

    /**
     * Get the value in string format
     */
    ngOnInit() {
        this.valueString = this.value ? this.value.toString() : '';
    }

    /**
     * Click on calculator number
     * @param  number
     */
    clickOnNumber(number: string) {

        if (this.valueString && this.valueString !== '0') {
            this.valueString += number;
        } else {
            this.valueString = number;
        }
        this.valueChange.emit(this.valueString);
    }

    /**
     * Delete last number clicked
     */
    backspace() {
        this.valueString = this.valueString.substring(0, this.valueString.length - 1);
        this.valueChange.emit(this.valueString);
    }

    /**
     * Disabled the comma if there is already one
     */
    disableDecimal() {
        return this.valueString && this.valueString.indexOf('.') > -1;
    }
}
