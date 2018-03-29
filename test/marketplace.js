/* globals assert, contract, it, artifacts, web3 */
require('babel-polyfill')
var Marketplace = artifacts.require('./Marketplace.sol')

const product = {
  name: 'iPhone',
  category: 'Phones',
  imgLink: 'no image',
  imgDesc: 'no desc',
  price: 2000000000000000000,
  contact: 'Sofia',
  state: 0,
  qty: 3
}

const getBalance = addr => (new Promise((resolve, reject) => (
  web3.eth.getBalance(addr, function (err, balance) {
    if (err) return reject(err)
    resolve(balance)
  })
)))

contract('Marketplace', function (accounts) {
  it('should create a Marketplace contract', async function () {
    const contract = await Marketplace.deployed()

    assert.isOk(contract)
  })

  it('should create a product', async function() {
    const contract = await Marketplace.deployed()

    await contract.newProduct(
      product.name,
      product.category,
      product.imgLink,
      product.imgDesc,
      product.price,
      product.contact,
      product.state,
      product.qty)
  }, { from: accounts[0] })

  it('should retrieve a product', async function() {
    const contract = await Marketplace.deployed()
    await contract.newProduct(
      product.name,
      product.category,
      product.imgLink,
      product.imgDesc,
      product.price,
      product.contact,
      product.state,
      product.qty, { from: accounts[0] })
    const id = 2

    const result = await contract.getProduct(id)
    assert.equal(result[0], id)
    assert.equal(result[1], product.name)
    assert.equal(result[2], product.category)
    assert.equal(result[3], product.imgLink)
    assert.equal(result[4], product.imgDesc)
    assert.equal(result[5], product.price)
    assert.equal(result[6], product.qty)
    assert.equal(result[7], 0) // InStock
    assert.equal(result[8], 0) // New
  })

  it('should retrieve the products ids', async function() {
    const contract = await Marketplace.deployed()

    const result = await contract.getProducts()
    assert.equal(result[0], 1)
    assert.equal(result[1], 2)
  })

  it('should retrieve the price', async function() {
    const contract = await Marketplace.deployed()
    const id = 1
    const qty = 2

    const result = await contract.getPrice(id, qty)
    assert.equal(result, product.price * qty)
  })

  it('should update the quantity', async function() {
    const contract = await Marketplace.deployed()
    const id = 1
    const qty = 2
    await contract.update(id, qty)

    const result = await contract.getProduct(id)
    assert.equal(result[6], qty)
  })

  it('should be able to buy a product', async function() {
    const contract = await Marketplace.deployed()
    const id = 1
    const qty = 1
    const contact = 'Sofia'
    await contract.buy(id, contact, qty, { value:product.price, from: accounts[1] })

    const result = await contract.getProduct(id)
    assert.equal(result[6], 1) // One item has left in stock
  })

  it('should be able to buy second time', async function() {
    const contract = await Marketplace.deployed()
    const id = 1
    const qty = 1
    const contact = 'Sofia'
    await contract.buy(id, contact, qty, { value:product.price, from: accounts[1] })

    const result = await contract.getProduct(id)
    assert.equal(result[6], 0) // No item has left in stock
  })

  it('shouldn\'t be able to buy, when the product is not in stock', async function() {
    const contract = await Marketplace.deployed()
    const id = 1
    const qty = 1
    const contact = 'Sofia'
    try {
      const res = await contract.buy(id, contact, qty, { value:product.price, from: accounts[1] })
      assert.isNull(res) // This line shouldn't be reachable
    } catch (e) {
      assert.ok(e)
    }
  })

  it('shouldn\'t be able to withdraw money from account who is not the seller', async function() {
    const contract = await Marketplace.deployed()
    const id = 1
    const qty = 2

    try {
      const res = await contract.withdraw(id, qty, { from: accounts[1] })
      assert.isNull(res) // This line shouldn't be reachable
    } catch (e) {
      assert.ok(e)
    }
  })

  it('should be able to withdraw money from account who is the seller', async function() {
    const contract = await Marketplace.deployed()
    const id = 1
    const qty = 2

    const balance = await getBalance(accounts[0])
    await contract.withdraw(id, qty)
    const newBalance = await getBalance(accounts[0])
    assert.isBelow(balance.toNumber(), newBalance.toNumber())
  })

  it('shouldn\'t be able to withdraw money, when all the money for the product are paid', async function() {
    const contract = await Marketplace.deployed()
    const id = 1
    const qty = 1

    try {
      const res = await contract.withdraw(id, qty)
      assert.isNull(res) // This line shouldn't be reachable
    } catch (e) {
      assert.ok(e)
    }
  })

  it('shouldn\'t have any tips', async function() {
    const contract = await Marketplace.deployed()

    try {
      const res = await contract.withdrawTips({ from: accounts[0] })
      assert.isNull(res) // This line shouldn't be reachable
    } catch (e) {
      assert.ok(e)
    }
  })

  it('shouldn\'t be able to withdraw tips from account who is not the owner of the store', async function() {
    const contract = await Marketplace.deployed()
    const id = 2
    const qty = 1
    const contact = 'Sofia'
    await contract.buy(id, contact, qty, { value:product.price + 2000000000000000000, from: accounts[1] })

    try {
      const res = await contract.withdrawTips({ from: accounts[1] })
      assert.isNull(res) // This line shouldn't be reachable
    } catch (e) {
      assert.ok(e)
    }
  })

  it('should be able to withdraw tips from account who is the owner of the store', async function() {
    const contract = await Marketplace.deployed()
    const balance = await getBalance(accounts[0])
    await contract.withdrawTips({ from: accounts[0] })
    const newBalance = await getBalance(accounts[0])
    assert.isBelow(balance.toNumber(), newBalance.toNumber())
  })
})
