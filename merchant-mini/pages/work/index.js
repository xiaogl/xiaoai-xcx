const money=n=>((n||0)/100).toFixed(2)
Page({
  data:{ready:false,error:'',tab:'服务',tabs:['服务','预约','排班']},
  onLoad(query){
    const credential=query.token?query:wx.getStorageSync('deskCredential')
    if(!credential?.token){this.setData({error:'请使用老板签发的门店助手入口'});return}
    this.credential=credential
    this.load()
  },
  onPullDownRefresh(){this.load().finally(()=>wx.stopPullDownRefresh())},
  async load(action='read',extra={}){
    if(!this.credential)return
    const {demo,storeId,token}=this.credential
    try{
      const d=await new Promise((resolve,reject)=>wx.request({
        url:getApp().globalData.apiOrigin+'/api/operations?mode=desk&demo='+encodeURIComponent(demo),method:'POST',
        data:{action,storeId,token,...extra},success:r=>r.statusCode===200?resolve(r.data):reject(new Error(r.data?.error||'读取失败')),fail:()=>reject(new Error('无法连接门店服务'))
      }))
      wx.setStorageSync('deskCredential',this.credential)
      const visits=d.visits.map(v=>({...v,customerName:d.customers.find(c=>c.id===v.customer)?.name,workerName:d.staff.find(w=>w.id===v.staff)?.name}))
      this.setData({ready:true,error:'',store:d.store,role:({owner:'老板',worker:'技师',desk:'前台'})[d.role],visits,appointments:d.appointments.map(a=>({...a,stateName:({booked:'待到店',done:'已核销',cancelled:'已取消',noshow:'未到店'})[a.status]})),tabs:d.role==='owner'?['服务','预约','排班','经营']:['服务','预约','排班'],
        shifts:d.staff.map(w=>({id:w.id,name:w.name,days:[1,2,3,4,5,6,0].map(day=>'周'+'日一二三四五六'[day]+'　'+(w.shifts?.[day]?.join('、')??'默认时段')).join('\n')})),
        income:money((d.entries||[]).filter(e=>e.type!=='支出').reduce((s,e)=>s+e.amount,0)),expense:money(-(d.entries||[]).filter(e=>e.type==='支出').reduce((s,e)=>s+e.amount,0)),commission:money(visits.reduce((s,v)=>s+(v.commission||0),0))})
    }catch(e){this.setData({ready:false,error:e.message,visits:[],appointments:[],shifts:[]})}
  },
  select(e){this.setData({tab:e.currentTarget.dataset.tab})},
  finish(e){const id=e.currentTarget.dataset.id;wx.showModal({title:'结束本次服务？',content:'完成后交由前台收款。',success:r=>{if(r.confirm)this.load('finish',{id,request:id})}})}
})
