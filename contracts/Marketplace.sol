pragma solidity ^0.4.18;
import "./SafeMath.sol";


contract Marketplace {
    address private owner;
    uint private tips = 0;
    enum Status { InStock, Sold }
    enum ProductCondition { New, Used }

    uint public productIndex;
    uint[] private productIds;
    mapping (address => mapping(uint => Product)) private stores;
    mapping (uint => address) private productIdInStore;

    event onNewProduct(
        uint _productId, 
        string _name, 
        string _category, 
        string _imageLink, 
        string _descLink, 
        uint _price, 
        uint _productCondition
    );

    event onProductSell(uint _productId, uint _status);

    struct Product {
        uint id;
        string name;
        string category;
        string imageLink;
        string descLink;
        uint price;
        uint quantity;
        Status status;
        address sellerAddr;
        string sellerContact;
        address buyerAddr;
        string buyerContact;
        ProductCondition condition;
        uint forPayment;
    }

    function Marketplace() public {
        productIndex = 0;
        owner = msg.sender;
    }

    function() public payable {
        require(false);
    }

    function newProduct(
        string _name, 
        string _category, 
        string _imageLink, 
        string _descLink, 
        uint _price, 
        string _sellerContact,
        uint _productCondition,
        uint _quantity) public returns (uint) {
        // Verify
        require(address(0x0) != msg.sender);
        require(_price > 0);
        require(_quantity > 0);

        productIndex += 1;
        Product memory product = Product(
            productIndex, 
            _name, 
            _category,
            _imageLink, 
            _descLink, 
            _price, 
            _quantity,
            Status.InStock, 
            msg.sender, 
            _sellerContact,
            address(0x0),
            "",
            ProductCondition(_productCondition),
            0
        );
        stores[msg.sender][productIndex] = product;
        productIdInStore[productIndex] = msg.sender;
        productIds.push(productIndex);

        onNewProduct(productIndex, _name, _category, _imageLink, _descLink, _price, _productCondition);

        return productIndex;
    }

    function getProduct(uint _productId) public view returns 
        (uint, string, string, string, string, uint, uint, Status, ProductCondition) {
        Product memory product = stores[productIdInStore[_productId]][_productId];

        // Verify
        require(product.id == _productId);

        return (
            product.id, 
            product.name, 
            product.category, 
            product.imageLink, 
            product.descLink, 
            product.price, 
            product.quantity, 
            product.status, 
            product.condition
        );
    }

    function getProducts() public view returns(uint[]) {
        return productIds;
    }

    function getPrice(uint _productId, uint _quantity) public view returns (uint) {
        address seller = productIdInStore[_productId];
        Product memory product = stores[seller][_productId];

        return SafeMath.mul(product.price, _quantity);
    }

    function update(uint _productId, uint _newQuantity) public {
        address seller = productIdInStore[_productId];

        // Verify
        require(seller == msg.sender);
        Product storage product = stores[seller][_productId];

        product.quantity = _newQuantity;
    }

    function buy(uint _productId, string _buyerContact, uint _quantity) public payable {
        address seller = productIdInStore[_productId];
        Product storage product = stores[seller][_productId];
        uint sum = SafeMath.mul(product.price, _quantity);

        // Verify
        require(_quantity > 0);
        require(product.id == _productId);
        require(msg.value >= sum);
        require(product.quantity >= _quantity);
        require(product.status == Status.InStock);
        require(address(0x0) != msg.sender);

        product.buyerAddr = msg.sender;
        product.buyerContact = _buyerContact;
        product.quantity = SafeMath.sub(product.quantity, _quantity);
        product.status = product.quantity > 0 ? Status.InStock : Status.Sold;
        product.forPayment = SafeMath.add(product.forPayment, _quantity);

        // Tips
        if (msg.value > SafeMath.mul(product.price, _quantity)) {
            tips = SafeMath.add(tips, SafeMath.sub(msg.value, sum));
        }
        
        // Event
        onProductSell(_productId, product.quantity > 0 ? 0 : 1);
    }

    function withdraw(uint _productId, uint _quantity) public {
        require(_quantity > 0);
        address seller = productIdInStore[_productId];
        // Verify
        require(seller == msg.sender);

        Product storage product = stores[seller][_productId];
        require(product.forPayment >= _quantity);

        product.forPayment = SafeMath.sub(product.forPayment, _quantity);

        // Transfer money
        seller.transfer(SafeMath.mul(product.price, _quantity));
    }

    function withdrawTips() public {
        require(msg.sender == owner);
        require(tips > 0);
        uint toTransfer = tips;
        tips = 0;

        // Transfer tips
        owner.transfer(toTransfer);
    }
}
