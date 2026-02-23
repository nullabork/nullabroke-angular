import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilingResultRowComponent } from './filing-result-row.component';
import { describe, it, expect } from 'vitest';
import { provideRouter } from '@angular/router';
import { Filing } from '../../../core/models/filing.model';

describe('FilingResultRowComponent', () => {
  let component: FilingResultRowComponent;
  let fixture: ComponentFixture<FilingResultRowComponent>;

  const mockFiling: Filing = {
    id: 1,
    accessionNumber: '0001234567-24-000001',
    formType: '10-K',
    companyConformedName: 'Test Corp',
    centralIndexKey: 12345,
    relationship: '',
    dateFiled: '2024-01-15',
    datePublished: '2024-01-15',
    size: 1000,
    description: 'Annual report',
    noDocument: false,
    ticker: 'TST',
    tags: ['10-K', 'annual'],
    snowflakeId: '',
    fileNumber: '',
    filmNumber: '',
    sponsorCIK: null,
    documentCount: 1,
    amendedAccessionNumber: '',
    isAmendment: false,
    amendmentAccessionNumber: '',
    isAmended: false,
    fileName: '',
    isEmpty: false,
    absoluteFileUrl: '',
  };

  const setupTest = async (filing: Filing = mockFiling) => {
    await TestBed.configureTestingModule({
      imports: [FilingResultRowComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FilingResultRowComponent);
    fixture.componentRef.setInput('filing', filing);
    fixture.detectChanges();
    component = fixture.componentInstance;
  };

  it('should create', async () => {
    await setupTest();
    expect(component).toBeTruthy();
  });

  it('should have the filing-result-row host class', async () => {
    await setupTest();
    expect(fixture.nativeElement.classList.contains('filing-result-row')).toBe(true);
  });

  it('should render ticker with hyphen before description', async () => {
    await setupTest();
    const text = fixture.nativeElement.textContent;
    const tickerIdx = text.indexOf('TST');
    const hyphenIdx = text.indexOf('-', tickerIdx);
    const descIdx = text.indexOf('Annual report');
    expect(tickerIdx).toBeGreaterThanOrEqual(0);
    expect(hyphenIdx).toBeGreaterThan(tickerIdx);
    expect(descIdx).toBeGreaterThan(hyphenIdx);
  });

  it('should not render ticker when absent', async () => {
    await setupTest({ ...mockFiling, ticker: '' });
    expect(fixture.nativeElement.textContent).not.toContain('TST');
    // Should not have the hyphen separator either
    const firstCell = fixture.nativeElement.querySelector('a > div:first-child');
    expect(firstCell.textContent).not.toContain(' - ');
  });

  it('should render company name', async () => {
    await setupTest();
    expect(fixture.nativeElement.textContent).toContain('Test Corp');
  });

  it('should render form type badge', async () => {
    await setupTest();
    expect(fixture.nativeElement.textContent).toContain('10-K');
  });

  it('should render description as primary title when present', async () => {
    await setupTest();
    const topRow = fixture.nativeElement.querySelector('.font-medium.text-\\[\\#e0e0e0\\]');
    expect(topRow.textContent).toContain('Annual report');
  });

  it('should render company name as subtitle when description present', async () => {
    await setupTest();
    const subtitle = fixture.nativeElement.querySelector('.text-\\[\\#858585\\].truncate');
    expect(subtitle.textContent).toContain('Test Corp');
  });

  it('should show company name as primary title when description absent', async () => {
    await setupTest({ ...mockFiling, description: '' });
    const topRow = fixture.nativeElement.querySelector('.font-medium.text-\\[\\#e0e0e0\\]');
    expect(topRow.textContent).toContain('Test Corp');
  });

  it('should not render subtitle row when description absent', async () => {
    await setupTest({ ...mockFiling, description: '' });
    const subtitle = fixture.nativeElement.querySelector('.text-\\[\\#858585\\].truncate');
    expect(subtitle).toBeNull();
  });

  it('should render tags', async () => {
    await setupTest();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('10-K');
    expect(text).toContain('annual');
  });

  it('should not render tag elements when tags are empty', async () => {
    await setupTest({ ...mockFiling, tags: [] });
    const tagEls = fixture.nativeElement.querySelectorAll('.rounded');
    expect(tagEls.length).toBe(0);
  });

  it('should render date', async () => {
    await setupTest();
    // DatePipe 'mediumDate' format includes the month name
    expect(fixture.nativeElement.textContent).toContain('2024');
  });

  it('should have routerLink to correct document URL', async () => {
    await setupTest();
    const link = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/filings/document/0001234567-24-000001');
  });

  it('should use grid layout with 3 columns', async () => {
    await setupTest();
    const link = fixture.nativeElement.querySelector('a');
    expect(link.classList.contains('grid')).toBe(true);
    expect(link.classList.contains('grid-cols-[1fr_auto_auto]')).toBe(true);
  });
});
