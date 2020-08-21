const { STRIPE_SECRET_KEY } = process.env 
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = {
    makeSession: async(req, res) => {
        const { priceId }  = req.body 

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
              {
                price: priceId,
                quantity: 1,
              },
            ],
            // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
            success_url: `https://davamarketing.com/order-confirmation`,
            cancel_url: `https://davamarketing.com/pricing`,
            allow_promotion_codes: true,
        })

        res.send({
            sessionId: session.id,
        });
    }
}