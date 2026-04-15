import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface UnitsData {
  categories: Record<string, string[]>;
  arithmeticOperators: Operator[];
}

interface Operator {
  label: string;
  value: string;
}

interface QuantityDto {
  value: number;
  unit: string;
  category: string;
}

interface ConversionResponse {
  value: number;
  unit: string;
}

interface HistoryEntry {
  createdAt?: string;
  isError?: boolean;
  description?: string;
  errorMessage?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private readonly defaultUnitsData: UnitsData = {
    categories: {
      Length: ['Feet', 'Inches', 'Yards', 'Centimeters'],
      Weight: ['Kilogram', 'Gram', 'Pound'],
      Volume: ['Litre', 'Millilitre', 'Gallon'],
      Temperature: ['Celsius', 'Fahrenheit', 'Kelvin']
    },
    arithmeticOperators: [
      { label: 'Add (+)', value: 'add' },
      { label: 'Subtract (-)', value: 'subtract' },
      { label: 'Divide (/)', value: 'divide' }
    ]
  };

  readonly categoryMeta = [
    { key: 'Length', icon: '📏' },
    { key: 'Weight', icon: '⚖️' },
    { key: 'Temperature', icon: '🌡️' },
    { key: 'Volume', icon: '🧴' }
  ];

  readonly tabs = [
    { key: 'comparison', label: 'Comparison' },
    { key: 'conversion', label: 'Conversion' },
    { key: 'arithmetic', label: 'Arithmetic' }
  ];

  category = 'Length';
  action = 'comparison';
  unitsByCategory: Record<string, string[]> = {};
  allArithmeticOperators: Operator[] = this.defaultUnitsData.arithmeticOperators;
  currentOperators: Operator[] = [];
  historyVisible = false;

  compareValue1 = 1;
  compareValue2 = 1000;
  compareUnit1 = '';
  compareUnit2 = '';

  convertValue = 1;
  convertUnitFrom = '';
  convertUnitTo = '';

  arithValue1 = 1;
  arithValue2 = 1;
  arithUnit1 = '';
  arithUnit2 = '';
  arithOperator = 'add';
  arithTargetUnit = '';

  resultText = '-';
  resultSubText = '';
  message = '';
  historyMessage = '';
  historyEntries: HistoryEntry[] = [];

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const unitsData = await fetch('data/units.json')
        .then((response) => {
          if (!response.ok) {
            throw new Error('Unable to load units.json');
          }
          return response.json() as Promise<UnitsData>;
        })
        .catch(() => this.defaultUnitsData);

      this.unitsByCategory = unitsData.categories;
      this.allArithmeticOperators = unitsData.arithmeticOperators?.length
        ? unitsData.arithmeticOperators
        : this.defaultUnitsData.arithmeticOperators;

      this.fillAllUnitDefaults();
      this.refreshOperators();
      this.updateActionAvailability();
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Unable to initialize app.';
    }
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get userName(): string {
    return this.authService.getUserName();
  }

  get shouldHideArithTargetUnit(): boolean {
    return this.action === 'arithmetic' && this.arithOperator === 'divide';
  }

  get arithmeticSupported(): boolean {
    return this.getAllowedOperators().length > 0;
  }

  get selectedUnits(): string[] {
    return this.unitsByCategory[this.category] || [];
  }

  setCategory(category: string): void {
    this.category = category;
    this.fillAllUnitDefaults();
    this.refreshOperators();
    this.updateActionAvailability();
    this.message = '';
  }

  setAction(action: string): void {
    if (action === 'arithmetic' && !this.arithmeticSupported) {
      this.message = 'Arithmetic is not supported for Temperature.';
      return;
    }

    this.action = action;
    this.message = '';
  }

  async calculate(): Promise<void> {
    this.message = '';
    this.resultSubText = '';

    try {
      if (this.action === 'comparison') {
        const first = this.quantity(this.compareValue1, this.compareUnit1);
        const second = this.quantity(this.compareValue2, this.compareUnit2);

        const response = await this.apiService.request<boolean>('compare', {
          method: 'POST',
          body: { first, second }
        });

        this.resultText = response ? 'True' : 'False';
        this.resultSubText = `${first.value} ${first.unit} and ${second.value} ${second.unit}`;
        await this.refreshHistoryIfVisible();
        return;
      }

      if (this.action === 'conversion') {
        const source = this.quantity(this.convertValue, this.convertUnitFrom);

        const response = await this.apiService.request<ConversionResponse>('convert', {
          method: 'POST',
          body: { source, targetUnit: this.convertUnitTo }
        });

        this.resultText = this.formatNumber(response.value);
        this.resultSubText = response.unit;
        await this.refreshHistoryIfVisible();
        return;
      }

      const first = this.quantity(this.arithValue1, this.arithUnit1);
      const second = this.quantity(this.arithValue2, this.arithUnit2);

      if (this.arithOperator === 'divide') {
        const divideResponse = await this.apiService.request<number>('divide', {
          method: 'POST',
          body: { first, second }
        });

        this.resultText = this.formatNumber(divideResponse);
        this.resultSubText = 'Unitless ratio';
        await this.refreshHistoryIfVisible();
        return;
      }

      const endpoint = this.arithOperator === 'subtract' ? 'subtract' : 'add';
      const response = await this.apiService.request<ConversionResponse>(endpoint, {
        method: 'POST',
        body: { first, second, targetUnit: this.arithTargetUnit }
      });

      this.resultText = this.formatNumber(response.value);
      this.resultSubText = response.unit;
      await this.refreshHistoryIfVisible();
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Calculation failed.';
      this.resultText = '-';
      this.resultSubText = '';
    }
  }

  async toggleHistory(): Promise<void> {
    if (!this.isLoggedIn) {
      this.message = 'Login to view history.';
      return;
    }

    this.historyVisible = !this.historyVisible;

    if (this.historyVisible) {
      await this.loadHistory();
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.isLoggedIn) {
        await this.apiService.request('logout', {
          method: 'POST',
          requiresAuth: true
        });
      }
    } catch {
      // Ignore logout transport errors and clear local auth regardless.
    } finally {
      this.authService.clearAuth();
      this.historyVisible = false;
      this.historyEntries = [];
      this.historyMessage = '';
      this.message = '';
    }
  }

  formatTimestamp(dateText?: string): string {
    return dateText ? new Date(dateText).toLocaleString() : '';
  }

  isTabDisabled(tabKey: string): boolean {
    return tabKey === 'arithmetic' && !this.arithmeticSupported;
  }

  private getAllowedOperators(): Operator[] {
    if (this.category === 'Temperature') {
      return [];
    }

    return this.allArithmeticOperators;
  }

  private refreshOperators(): void {
    this.currentOperators = this.getAllowedOperators();

    if (!this.currentOperators.length) {
      this.arithOperator = '';
      return;
    }

    const hasCurrent = this.currentOperators.some((operator) => operator.value === this.arithOperator);
    if (!hasCurrent) {
      this.arithOperator = this.currentOperators[0].value;
    }
  }

  private fillAllUnitDefaults(): void {
    const units = this.selectedUnits;
    this.compareUnit1 = units[0] || '';
    this.compareUnit2 = units[1] || units[0] || '';
    this.convertUnitFrom = units[0] || '';
    this.convertUnitTo = units[1] || units[0] || '';
    this.arithUnit1 = units[0] || '';
    this.arithUnit2 = units[1] || units[0] || '';
    this.arithTargetUnit = units[0] || '';
  }

  private updateActionAvailability(): void {
    if (!this.arithmeticSupported && this.action === 'arithmetic') {
      this.action = 'comparison';
      this.message = 'Arithmetic is not supported for Temperature.';
    }
  }

  private quantity(value: number, unit: string): QuantityDto {
    return {
      value: Number(value),
      unit,
      category: this.category
    };
  }

  private async loadHistory(): Promise<void> {
    this.historyMessage = '';
    this.historyEntries = [];

    try {
      const entries = await this.apiService.request<HistoryEntry[]>('history', {
        method: 'GET',
        requiresAuth: true
      });

      if (!entries?.length) {
        this.historyMessage = 'No history found.';
        return;
      }

      this.historyEntries = entries;
    } catch (error) {
      this.historyMessage = error instanceof Error ? error.message : 'Unable to load history.';
    }
  }

  private async refreshHistoryIfVisible(): Promise<void> {
    if (!this.historyVisible || !this.isLoggedIn) {
      return;
    }

    await this.loadHistory();
  }

  private formatNumber(value: number): string {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return String(value);
    }

    return n % 1 === 0 ? String(n) : n.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  }
}
