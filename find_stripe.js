const fs = require('fs');
const Stripe = require('stripe');

// Read env local
const envFile = fs.readFileSync('.env.local', 'utf8');
const stripeKeyLine = envFile.split('\n').find(line => line.startsWith('STRIPE_SECRET_KEY='));
const stripeKey = stripeKeyLine ? stripeKeyLine.split('=')[1].replace(/"/g, '').trim() : '';

const stripe = new Stripe(stripeKey);

async function main() {
  console.log("Searching for customers...");
  const customers = await stripe.customers.list({ limit: 20 });
  
  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({ customer: customer.id });
    console.log(`\nCustomer: ${customer.name} (${customer.email}) - ID: ${customer.id}`);
    console.log(`Subscriptions: ${subs.data.length}`);
    for (const sub of subs.data) {
      console.log(` - Sub ID: ${sub.id}, Status: ${sub.status}`);
    }
  }
}

main().catch(console.error);
