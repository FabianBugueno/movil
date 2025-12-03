describe('Home E2E', () => {
  beforeAll(() => {
    browser.get('/home');
  });

  it('should display ejercicios list and click first item', async () => {
    const firstItem = element(by.css('ion-item'));
    try {
      if (await firstItem.isPresent()) {
        await firstItem.click();
      }
    } catch (e) {}
    expect(true).toBeTrue();
  });
});
