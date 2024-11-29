pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";

/*
 * Helper template for multiplying two signals
 */
template Multiply2() {
    signal input a;
    signal input b;
    signal output out;
    
    out <== a * b;
}

/*
 * Template for checking if a value is greater than or equal to another
 */
template GreaterThanOrEqual() {
    signal input in[2];
    signal output out;

    component gt = GreaterThan(252);
    component eq = IsEqual();
    component or = OR();

    gt.in[0] <== in[0];
    gt.in[1] <== in[1];
    
    eq.in[0] <== in[0];
    eq.in[1] <== in[1];
    
    or.a <== gt.out;
    or.b <== eq.out;
    
    out <== or.out;
}

/*
 * Main circuit for NFT marketplace transaction verification
 */
template NFTMarketplaceTransaction() {
    // Public inputs
    signal input nftTokenId;
    signal input listingPrice;
    signal input currentOwner; // Seller's address (public)
    
    // Private inputs
    signal input buyerBalance;
    signal input buyerAddress;
    signal input actualPrice;
    signal input timestamp;
    
    // Intermediate signals
    signal validFunds;
    signal validPrice;
    signal validOwner;
    signal validTimestamp;
    
    // Components
    component priceCheck = IsEqual();
    component ownerCheck = IsEqual();
    component fundCheck = GreaterThanOrEqual();
    
    // Multiplication components for validation
    component mul1 = Multiply2();
    component mul2 = Multiply2();
    component mul3 = Multiply2();
    
    // Verify price matches listing
    priceCheck.in[0] <== listingPrice;
    priceCheck.in[1] <== actualPrice;
    validPrice <== priceCheck.out;
    
    // Check sufficient funds
    fundCheck.in[0] <== buyerBalance;
    fundCheck.in[1] <== actualPrice;
    validFunds <== fundCheck.out;
    
    // Verify current owner
    ownerCheck.in[0] <== currentOwner;
    ownerCheck.in[1] <== buyerAddress;
    validOwner <== 1 - ownerCheck.out; // Buyer cannot be current owner
    
    // Verify timestamp is valid (simplified check)
    validTimestamp <== 1; // For demonstration, assuming timestamp is always valid
    
    // Final validation using multiplication components
    mul1.a <== validFunds;
    mul1.b <== validPrice;
    
    mul2.a <== mul1.out;
    mul2.b <== validOwner;
    
    mul3.a <== mul2.out;
    mul3.b <== validTimestamp;
    
    // Output
    signal output valid;
    valid <== mul3.out;
}

component main {public [nftTokenId, listingPrice, currentOwner]} = NFTMarketplaceTransaction();