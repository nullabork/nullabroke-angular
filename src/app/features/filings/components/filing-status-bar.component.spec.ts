import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilingStatusBarComponent } from './filing-status-bar.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('FilingStatusBarComponent', () => {
  let component: FilingStatusBarComponent;
  let fixture: ComponentFixture<FilingStatusBarComponent>;

  const setupTest = async (loading = false, hasSearched = false, resultCount = 0) => {
    await TestBed.configureTestingModule({
      imports: [FilingStatusBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilingStatusBarComponent);
    fixture.componentRef.setInput('loading', loading);
    fixture.componentRef.setInput('hasSearched', hasSearched);
    fixture.componentRef.setInput('resultCount', resultCount);
    fixture.detectChanges();
    component = fixture.componentInstance;
  };

  it('should create', async () => {
    await setupTest();
    expect(component).toBeTruthy();
  });

  it('should have the filing-status-bar host class', async () => {
    await setupTest();
    expect(fixture.nativeElement.classList.contains('filing-status-bar')).toBe(true);
  });

  it('should show "Searching..." when loading', async () => {
    await setupTest(true, false, 0);
    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer.textContent).toContain('Searching...');
  });

  it('should show result count when hasSearched and not loading', async () => {
    await setupTest(false, true, 5);
    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer.textContent).toContain('5 filing(s)');
  });

  it('should show "Ready" when not loading and not searched', async () => {
    await setupTest(false, false, 0);
    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer.textContent).toContain('Ready');
  });
});
