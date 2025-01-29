const baseUrl = import.meta.env.VITE_BASE_URL
const apiPath = import.meta.env.VITE_API_PATH
import { useEffect, useRef, useState } from 'react'
import { Modal } from 'bootstrap'
import axios from 'axios'


function App() {
  const defaultModalState = {
    imageUrl: "",
    title: "",
    category: "",
    unit: "",
    origin_price: "",
    price: "",
    description: "",
    content: "",
    is_enabled: 0,
    imagesUrl: [""]
  };
  // 建立狀態
  const [isAuth, setIsAuth] = useState(false);
  const [account, setAccount] = useState({
    username: '',
    password: ''
  })
  const [products, setProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState(defaultModalState);
  const [productMode, setProductMode] = useState('create')
  // 取DOM
  const productModalRef = useRef(null);
  const deleteModalRef = useRef(null);

  // 處理輸入帳號密碼
  const handleAccountInput = (e) => {
    const { name, value } = e.target;
    setAccount({
      ...account,
      [name]: value
    })
  }
  // 取得產品資料API
  const getProductData = async () => {
    try {
      const res = await axios.get(`${baseUrl}/v2/api/${apiPath}/admin/products`)
      setProducts(res.data.products);
    } catch (error) {
      console.log('取得資料失敗')
    }
  }
  // 登入API
  const accountLogin = async () => {
    try {
      const res = await axios.post(`${baseUrl}/v2/admin/signin`, account)
      const { token, expired } = res.data;
      document.cookie = `eToken=${token}; expires=${new Date(expired)}`;
      axios.defaults.headers.common['Authorization'] = token;
      getProductData();
      setIsAuth(true);
    } catch (error) {
      Swal.fire({
        text: "登入失敗",
        icon: "error"
      })
    }
  }
  // 處理登入
  const handleLogin = (e) => {
    e.preventDefault();
    const { username, password } = account;
    {
      username && password ? accountLogin() :
        Swal.fire({
          text: "請輸入帳號密碼",
          icon: "warning"
        })
    }
  }
  // 修正：刪除此段
  // // 從cookie取得token並設置預設header
  // const authToken = document.cookie.replace(
  //   /(?:(?:^|.*;\s*)eToken\s*\=\s*([^;]*).*$)|^.*$/,
  //   "$1",
  // );
  // axios.defaults.headers.common['Authorization'] = authToken;

  // 修正內容：在登入頁面戳API檢查是否登入，這樣重新整理就不需要重新輸入資料
  const checkUserLogin = async () => {
    try {
      await axios.post(`${baseUrl}/v2/api/user/check`);
      getProductData();
      setIsAuth(true);
    } catch (error) {
      console.error('請重新登入');
    }
  }
  // 在登入畫面渲染時呼叫檢查登入的API
  useEffect(() => {
    const authToken = document.cookie.replace(
      /(?:(?:^|.*;\s*)eToken\s*\=\s*([^;]*).*$)|^.*$/,
      "$1",
    );
    axios.defaults.headers.common['Authorization'] = authToken;
    checkUserLogin();
  }, [])

  // 取得的DOM new建立實例
  useEffect(() => {
    new Modal(productModalRef.current, {
      backdrop: false,
    })
    new Modal(deleteModalRef.current, {
      backdrop: true
    })
  }, [])
  // 取得實例並處理modal打開
  const handleOpenModal = (mode, product) => {
    setProductMode(mode);
    mode === 'create' ? setTempProduct(defaultModalState) : setTempProduct(product);
    const productModal = Modal.getInstance(productModalRef.current);
    productModal.show();
  }
  const handleCloseModal = () => {
    const productModal = Modal.getInstance(productModalRef.current);
    productModal.hide();
  }
  // 處理產品modal input
  const handleProductModalInput = (e) => {
    const { value, name, type, checked } = e.target;
    setTempProduct({
      ...tempProduct,
      [name]: type === 'checkbox' ? checked : value,
    })
  }
  // 處理modal 副圖區input
  const handleImagesInput = (e, index) => {
    const { value } = e.target;
    const newImages = [...tempProduct.imagesUrl];
    newImages[index] = value;
    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages
    })
  }
  // 處理新增刪除圖片按鈕
  const handleAddDelmage = (mode) => {
    const newImages = [...tempProduct.imagesUrl]
    mode === 'add' ? newImages.push('') : newImages.pop();
    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages
    })
  }
  // 新增產品API 這裡修正：在新增修改API存成 1 : 0
  const createProduct = async () => {
    try {
      await axios.post(`${baseUrl}/v2/api/${apiPath}/admin/product`, {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0,
        }
      })
      handleMessageSuccess('新增產品');
    } catch (error) {
      handleMessageFail('新增產品');
    }
  }
  // 編輯產品API 這裡修正：在新增修改API存成 1 : 0
  const editProduct = async () => {
    try {
      await axios.put(`${baseUrl}/v2/api/${apiPath}/admin/product/${tempProduct.id}`, {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0,
        }
      })
      handleMessageSuccess('更新產品');
    } catch (error) {
      handleMessageFail('更新產品');
    }
  }
  // 處理確認新增or編輯產品
  const handleUpdateProduct = () => {
    productMode === 'create' ? createProduct() : editProduct();
  }

  // 處理新增或編輯成功失敗
  const handleMessageSuccess = (mode) => {
    getProductData();
    handleCloseModal();
    Swal.fire({
      position: "top-end",
      icon: "success",
      text: `${mode}成功`,
      showConfirmButton: false,
      timer: 1500
    });
  }
  const handleMessageFail = (mode) => {
    Swal.fire({
      position: "top-end",
      icon: "error",
      text: `${mode}失敗`,
      showConfirmButton: false,
      timer: 1500
    });
  }
  // 刪除產品API
  const deleteProduct = async () => {
    try {
      await axios.delete(`${baseUrl}/v2/api/${apiPath}/admin/product/${tempProduct.id}`);
      handleMessageSuccess('刪除產品');
      handleCloseDeleteModal();
    } catch (error) {
      handleMessageFail('刪除產品');
    }
  }
  // 處理刪除產品打開關閉
  const handleOpenDeleteModal = (product) => {
    setTempProduct(product);
    const deleteModal = Modal.getInstance(deleteModalRef.current);
    deleteModal.show();
  }
  const handleCloseDeleteModal = () => {
    const deleteModal = Modal.getInstance(deleteModalRef.current);
    deleteModal.hide();
  }

  return (<>
    {isAuth ? (
      // 產品列表
      <div className="container my-5">
        <h4>學習組#3 異國香料電商</h4>
        <div className="d-flex mb-3">
          <h1>產品列表</h1>
          <button onClick={() => { handleOpenModal('create', tempProduct) }} type="button" className='btn btn-primary btn-lg ms-auto'>新增產品</button>
        </div>
        <table className="table">
          <thead className='table-primary'>
            <tr>
              <th scope="col">產品名稱</th>
              <th scope="col">產品類別</th>
              <th scope="col">原價</th>
              <th scope="col">售價</th>
              <th scope="col">是否啟用</th>
              <th scope="col">編輯管理</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <th scope="row">{product.title}</th>
                <td>{product.category}</td>
                <td>{product.origin_price}</td>
                <td>{product.price}</td>
                <td>{product.is_enabled ? (<p className='text-success'>是</p>) : (<p className='text-danger'>否</p>)}</td>
                <td><div className="btn-group">
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => { handleOpenModal('edit', product) }}>編輯</button>
                  <button onClick={() => { handleOpenDeleteModal(product) }} type="button" className="btn btn-outline-danger btn-sm">刪除</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      // 登入頁面
      <div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <h1 className="mb-5">請先登入</h1>
        <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
          <div className="form-floating mb-3">
            <input onChange={handleAccountInput} type="email" className="form-control" id="username" placeholder="name@example.com" name="username" />
            <label htmlFor="username">Email address</label>
          </div>
          <div className="form-floating">
            <input onChange={handleAccountInput} type="password" className="form-control" id="password" placeholder="Password" name="password" />
            <label htmlFor="password">Password</label>
          </div>
          <button className="btn btn-primary">登入</button>
        </form>
        <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
      </div>
    )}
    {/* 新增編輯產品modal */}
    <div ref={productModalRef} id="productModal" className="modal" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-bottom">
            <h5 className="modal-title fs-4">{productMode === 'create' ? '新增產品' : '編輯產品'}</h5>
            <button onClick={handleCloseModal} type="button" className="btn-close" aria-label="Close"></button>
          </div>

          <div className="modal-body p-4">
            <div className="row g-4">
              <div className="col-md-4">
                <div className="mb-4">
                  <label htmlFor="primary-image" className="form-label">
                    主圖
                  </label>
                  <div className="input-group">
                    <input
                      onChange={handleProductModalInput}
                      value={tempProduct.imageUrl}
                      name="imageUrl"
                      type="text"
                      id="primary-image"
                      className="form-control"
                      placeholder="請輸入圖片連結"
                    />
                  </div>
                  <img
                    src={tempProduct.imageUrl}
                    alt={tempProduct.title}
                    className="img-fluid"
                  />
                </div>

                {/* 副圖 */}
                <p>副圖區</p>
                <div className="border border-2 border-dashed rounded-3 p-3">
                  {tempProduct.imagesUrl?.map((image, index) => (
                    <div key={index} className="mb-2">
                      <label
                        htmlFor={`imagesUrl-${index + 1}`}
                        className="form-label"
                      >
                        副圖 {index + 1}
                      </label>
                      <input
                        onChange={(e) => { handleImagesInput(e, index) }}
                        value={image}
                        id={`imagesUrl-${index + 1}`}
                        type="text"
                        placeholder={`圖片網址 ${index + 1}`}
                        className="form-control mb-2"
                      />
                      {image && (
                        <img
                          src={image}
                          alt={`副圖 ${index + 1}`}
                          className="img-fluid mb-2"
                        />
                      )}
                    </div>
                  ))}
                  <div className="btn-group w-100">
                    {tempProduct.imagesUrl.length < 5 && tempProduct.imagesUrl[tempProduct.imagesUrl.length - 1] !== '' && <button onClick={() => { handleAddDelmage('add') }} className="btn btn-outline-primary btn-sm w-100">新增圖片</button>}
                    {tempProduct.imagesUrl.length > 1 && <button onClick={() => { handleAddDelmage('delete') }} className="btn btn-outline-danger btn-sm w-100">刪除圖片</button>}

                  </div>
                </div>
              </div>

              <div className="col-md-8">
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    標題
                  </label>
                  <input
                    onChange={handleProductModalInput}
                    value={tempProduct.title}
                    name="title"
                    id="title"
                    type="text"
                    className="form-control"
                    placeholder="請輸入標題"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="category" className="form-label">
                    分類
                  </label>
                  <input
                    onChange={handleProductModalInput}
                    value={tempProduct.category}
                    name="category"
                    id="category"
                    type="text"
                    className="form-control"
                    placeholder="請輸入分類"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="unit" className="form-label">
                    單位
                  </label>
                  <input
                    onChange={handleProductModalInput}
                    value={tempProduct.unit}
                    name="unit"
                    id="unit"
                    type="text"
                    className="form-control"
                    placeholder="請輸入單位"
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label htmlFor="origin_price" className="form-label">
                      原價
                    </label>
                    <input
                      onChange={handleProductModalInput}
                      value={tempProduct.origin_price}
                      name="origin_price"
                      id="origin_price"
                      type="number"
                      className="form-control"
                      placeholder="請輸入原價"
                    />
                  </div>
                  <div className="col-6">
                    <label htmlFor="price" className="form-label">
                      售價
                    </label>
                    <input
                      onChange={handleProductModalInput}
                      value={tempProduct.price}
                      name="price"
                      id="price"
                      type="number"
                      className="form-control"
                      placeholder="請輸入售價"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    產品描述
                  </label>
                  <textarea
                    onChange={handleProductModalInput}
                    value={tempProduct.description}
                    name="description"
                    id="description"
                    className="form-control"
                    rows={4}
                    placeholder="請輸入產品描述"
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label htmlFor="content" className="form-label">
                    說明內容
                  </label>
                  <textarea
                    onChange={handleProductModalInput}
                    value={tempProduct.content}
                    name="content"
                    id="content"
                    className="form-control"
                    rows={4}
                    placeholder="請輸入說明內容"
                  ></textarea>
                </div>

                <div className="form-check">
                  <input
                    onChange={handleProductModalInput}
                    // checked={tempProduct.is_enabled ? 1 : 0}
                    checked={tempProduct.is_enabled}
                    name="is_enabled"
                    type="checkbox"
                    className="form-check-input"
                    id="isEnabled"
                  />
                  <label className="form-check-label" htmlFor="isEnabled">
                    是否啟用
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer border-top bg-light">
            <button onClick={handleCloseModal} type="button" className="btn btn-secondary">
              取消
            </button>
            <button onClick={handleUpdateProduct} type="button" className="btn btn-primary">
              確認
            </button>
          </div>
        </div>
      </div>
    </div>
    {/* 是否刪除產品modal */}
    <div
      ref={deleteModalRef}
      className="modal fade"
      id="delProductModal"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5">刪除產品</h1>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            你是否要刪除
            <span className="text-danger fw-bold">{tempProduct.title}</span>
          </div>
          <div className="modal-footer">
            <button
              onClick={handleCloseDeleteModal}
              type="button"
              className="btn btn-secondary"
            >
              取消
            </button>
            <button onClick={deleteProduct} type="button" className="btn btn-danger">
              刪除
            </button>
          </div>
        </div>
      </div>
    </div>
  </>)
}

export default App
