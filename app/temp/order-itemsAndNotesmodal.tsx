{showNotesModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-3">Full Notes</h2>

              <p className="text-gray-800 whitespace-pre-wrap break-words">
                {currentNotes.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
              </p>

              <button
                onClick={() => setShowNotesModal(false)}
                className="mt-6 w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {itemsModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative max-h-[90vh] overflow-y-auto">
              
              <h2 className="text-xl font-semibold text-amber-800 mb-4">
                Order Items – {selectedOrderNumber}
              </h2>

              <div className="space-y-3">
                {selectedItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-lg text-sm"
                  >
                    <div>
                      <span className="text-gray-800 font-medium">
                        {item.product.name} × {item.quantity}
                      </span>
                      <p className="text-xs text-gray-600">
                        ₱ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Checkbox */}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={itemStatus[item.id] || false}
                        onChange={() =>
                          setItemStatus((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }))
                        }
                        className="w-5 h-5"
                      />
                      <span className="text-xs font-medium">
                        {itemStatus[item.id] ? (
                          <span className="text-green-600">Done</span>
                        ) : (
                          <span className="text-orange-600">Preparing</span>
                        )}
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  if (!selectedOrder) return;

                  const printWindow = window.open("", "_blank");
                  if (!printWindow) return;

                  const totalPrice = selectedItems.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  );

                  const itemsHTML = selectedItems
                    .map(
                      (item) => `
                      <tr>
                        <td>${item.product.name}</td>
                        <td style="text-align:center">${item.quantity}</td>
                        <td style="text-align:right">₱${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    `
                    )
                    .join("");

                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Receipt - ${selectedOrderNumber}</title>
                        <style>
                          @media print {
                            body { width: 80mm; margin: 0; font-family: monospace; }
                            table { width: 100%; border-collapse: collapse; }
                            th, td { padding: 2px 0; }
                            th { border-bottom: 1px dashed #000; }
                            td { border-bottom: 1px dashed #ccc; }
                            .total { font-weight: bold; text-align: right; margin-top: 4px; }
                            h2 { text-align: center; font-size: 16px; margin: 0 0 8px 0; }
                            p { margin: 2px 0; font-size: 12px; word-wrap: break-word; white-space: pre-wrap; }
                          }

                          body { width: 80mm; font-family: monospace; padding: 10px; }
                          h2 { text-align: center; font-size: 16px; margin-bottom: 10px; color: #b45309; }
                          table { width: 100%; margin-top: 8px; }
                          td { font-size: 12px; }
                          .total { font-weight: bold; margin-top: 6px; text-align: right; }
                          .section { margin-top: 6px; border-bottom: 1px dashed #000; padding-bottom: 4px; }
                        </style>
                      </head>
                      <body>
                        <h2>Receipt - ${selectedOrderNumber}</h2>

                        <div class="section">
                          <p><strong>Customer:</strong> ${selectedOrder.customerName}</p>
                          <p><strong>Email:</strong> ${selectedOrder.customerEmail}</p>
                          <p><strong>Phone:</strong> ${selectedOrder.customerPhone}</p>
                          <p><strong>Address:</strong> ${selectedOrder.deliveryAddress}</p>
                          <p><strong>Order Date:</strong> ${new Date(selectedOrder.createdAt).toLocaleString()}</p>
                          <p><strong>Order Status:</strong> ${selectedOrder.orderStatus}</p>
                          <p><strong>Payment Status:</strong> ${selectedOrder.paymentStatus}</p>
                          ${
                            selectedOrder.orderNotes
                              ? `<p style="white-space: pre-wrap; word-wrap: break-word;"><strong>Notes:</strong> ${selectedOrder.orderNotes}</p>`
                              : ""
                          }
                        </div>

                        <table>
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th style="text-align:center">Qty</th>
                              <th style="text-align:right">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${selectedItems
                              .map(
                                (item) => `
                              <tr>
                                <td>${item.product.name}</td>
                                <td style="text-align:center">${item.quantity}</td>
                                <td style="text-align:right">₱${(item.price * item.quantity).toFixed(2)}</td>
                              </tr>
                            `
                              )
                              .join("")}
                          </tbody>
                        </table>

                        <p class="total">Subtotal: ₱${selectedOrder.subtotal.toFixed(2)}</p>
                        <p class="total">Total: ₱${selectedOrder.total.toFixed(2)}</p>
                      </body>
                    </html>
                  `);

                  printWindow.document.close();
                  printWindow.focus();
                  printWindow.print();
                }}
                className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setItemsModalOpen(false)}
                className="mt-6 w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}