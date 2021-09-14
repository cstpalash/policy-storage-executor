const app = require('./app');
const event = require('./event.json');

test('Runs handler', async () => {
    let response = await app.handler(event, null)
    expect(JSON.stringify(response)).toContain('ok');
  }
)