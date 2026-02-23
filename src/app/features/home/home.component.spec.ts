import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { Title, Meta } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let titleService: Title;
  let metaService: Meta;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterModule.forRoot([])],
      providers: [
        { provide: AuthService, useValue: { isLoading$: of(false), isAuthenticated$: of(false) } },
      ],
    }).compileComponents();

    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set page title on init', () => {
    expect(titleService.getTitle()).toBe('Nullabroke - Search SEC Filings Like a Pro');
  });

  it('should set meta description on init', () => {
    const descTag = metaService.getTag('name="description"');
    expect(descTag).toBeTruthy();
    expect(descTag?.content).toContain('Search, explore, and analyze SEC filings');
  });

  it('should render the hero heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const h1 = el.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent).toContain('Search SEC Filings');
    expect(h1?.textContent).toContain('Like a Pro');
  });

  it('should render the hero screenshot', () => {
    const el: HTMLElement = fixture.nativeElement;
    const heroImg = el.querySelector('.hero-screenshot img') as HTMLImageElement;
    expect(heroImg).toBeTruthy();
    expect(heroImg.src).toContain('filings-presentations.png');
    expect(heroImg.alt).toBeTruthy();
    expect(heroImg.alt.length).toBeGreaterThan(10);
  });

  it('should render all four feature sections', () => {
    const el: HTMLElement = fixture.nativeElement;
    const h3s = el.querySelectorAll('article h3');
    expect(h3s.length).toBe(4);
    expect(h3s[0].textContent).toContain('Query Builder');
    expect(h3s[1].textContent).toContain('Save & Organize');
    expect(h3s[2].textContent).toContain('Document Viewer');
    expect(h3s[3].textContent).toContain('Works Everywhere');
  });

  it('should render feature screenshots with alt text and lazy loading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const featureImgs = el.querySelectorAll('.feature-img') as NodeListOf<HTMLImageElement>;
    expect(featureImgs.length).toBe(6);
    featureImgs.forEach(img => {
      expect(img.alt).toBeTruthy();
      expect(img.alt.length).toBeGreaterThan(10);
      expect(img.getAttribute('loading')).toBe('lazy');
    });
  });

  it('should have sign-in links pointing to /auth', () => {
    const el: HTMLElement = fixture.nativeElement;
    const links = el.querySelectorAll('a[href="/auth"]');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it('should use semantic HTML elements', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('header')).toBeTruthy();
    expect(el.querySelector('main')).toBeTruthy();
    expect(el.querySelector('footer')).toBeTruthy();
    expect(el.querySelector('nav')).toBeTruthy();
    expect(el.querySelectorAll('article').length).toBe(4);
  });

  it('should have aria labels on navigation and sections', () => {
    const el: HTMLElement = fixture.nativeElement;
    const nav = el.querySelector('nav');
    expect(nav?.getAttribute('aria-label')).toBe('Main navigation');
    const sections = el.querySelectorAll('section[aria-label]');
    expect(sections.length).toBeGreaterThanOrEqual(2);
  });

  it('should have aria-hidden on decorative elements', () => {
    const el: HTMLElement = fixture.nativeElement;
    const heroBg = el.querySelector('.hero-bg');
    expect(heroBg?.getAttribute('aria-hidden')).toBe('true');
    const ctaGlow = el.querySelector('.cta-glow');
    expect(ctaGlow?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should render the bottom CTA section', () => {
    const el: HTMLElement = fixture.nativeElement;
    const ctaHeading = el.querySelectorAll('h2');
    const ctaTexts = Array.from(ctaHeading).map(h => h.textContent);
    expect(ctaTexts.some(t => t?.includes('Ready to explore'))).toBe(true);
  });

  it('should render footer with help and issues links', () => {
    const el: HTMLElement = fixture.nativeElement;
    const footer = el.querySelector('footer');
    expect(footer).toBeTruthy();
    const footerLinks = footer!.querySelectorAll('a');
    const hrefs = Array.from(footerLinks).map(a => a.getAttribute('href') || a.getAttribute('ng-reflect-router-link'));
    expect(hrefs.some(h => h?.includes('help'))).toBe(true);
    expect(hrefs.some(h => h?.includes('issues'))).toBe(true);
  });
});
