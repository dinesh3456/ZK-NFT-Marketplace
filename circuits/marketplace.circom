pragma circom 2.1.4;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";

template Multiply2() {
    signal input a;
    signal input b;
    signal output out;
    
    out <== a * b;
}

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

template NFTMarketplaceTransaction() {
    signal input nftTokenId;
    signal input listingPrice;
    signal input currentOwner;
    signal input buyerBalance;
    signal input buyerAddress;
    signal input actualPrice;
    signal input timestamp;
    
    signal validFunds;
    signal validPrice;
    signal validOwner;
    signal validTimestamp;
    
    component priceCheck = IsEqual();
    component ownerCheck = IsEqual();
    component fundCheck = GreaterThanOrEqual();
    component mul1 = Multiply2();
    component mul2 = Multiply2();
    component mul3 = Multiply2();
    
    priceCheck.in[0] <== listingPrice;
    priceCheck.in[1] <== actualPrice;
    validPrice <== priceCheck.out;
    
    fundCheck.in[0] <== buyerBalance;
    fundCheck.in[1] <== actualPrice;
    validFunds <== fundCheck.out;
    
    ownerCheck.in[0] <== currentOwner;
    ownerCheck.in[1] <== buyerAddress;
    validOwner <== 1 - ownerCheck.out;
    
    validTimestamp <== 1;
    
    mul1.a <== validFunds;
    mul1.b <== validPrice;
    
    mul2.a <== mul1.out;
    mul2.b <== validOwner;
    
    mul3.a <== mul2.out;
    mul3.b <== validTimestamp;
    
    signal output valid;
    valid <== mul3.out;
}

component main {public [nftTokenId, listingPrice, currentOwner]} = NFTMarketplaceTransaction();