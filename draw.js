/**
 * Created by yiran on 2017/4/15.
 * 画图脚本
 */




var MAX_NUM = 100000000000;
var g_node_id = 0;
var g_edge_id = 0;
var g_switchid_start = MAX_NUM;
var g_snode_id = MAX_NUM;
var g_nodes = [];
var g_edges = [];
var g_node_map = {};  //节点元组表示到节点id的映射
var g_gk = [];
var g_tk = [];

//uid转成tuple，l表示层数
function uid2tuple(uid,l,tk){
    var tuple = [];
    var i = 0;
    for(i = 0;i < l;i++){
        if(i == l - 1){
            tuple.push(uid);
        }else{
            tuple.push(Math.floor(uid/parseInt(tk[l - i - 2])));
            uid = uid%parseInt(tk[l - i - 2]);
        }
    }
    return tuple;
}

//获取没有使用过的Id,参数是vis.DataSet生成的对象
function get_unuseid(dataset,start_id){
    var i = start_id;
    while(true){
        if(dataset._data[i] == null){
            return i;
        }
        i++;
    }
}

function build_dcell(pref,n,l,c_x,c_y) {
    var uid_1 = 0;
    var uid_2 = 0;
    var tuple_1 = 0;
    var tuple_2 = 0;
    var n1 = 0;
    var n2 = 0;
    var i = 0;
    var j = 0;
    var node_param = {mips:1000,bw:100000000};
    var edge_param = {delay:100,bw:100000000};
    //部分一，如果是最底层的dcel，则新建节点
    if(l == 0){
        var tuple_tmp;
        g_nodes.push({type:'switch',param:node_param,fixed:{x:false,y:false},x:c_x,y:c_y,id:g_snode_id,label:'switch'});  //添加交换机
        for(i = 0;i < n;i++){
            g_nodes.push({type:'server',param:node_param,uid:g_node_id,fixed:{x:false,y:false},x:c_x + 80*g_gk[l]*Math.cos((i/n)*2*Math.PI),y:c_y + 80*g_gk[l]*Math.sin((i/n)*2*Math.PI),id:g_node_id,tuple:pref.concat([i]),label:pref.concat([i])});//添加点
            g_edges.push({param:edge_param,id:g_edge_id++,from:g_node_id,to:g_snode_id});//连接到交换机
            g_node_map[String(pref.concat([i]))] = g_node_id;//映射
            g_node_id++;
        }
        g_snode_id++;
        return;
    }
    //部分二，建立低一层的dcell网络
    for(i = 0;i < g_gk[l];i++){
        build_dcell(pref.concat([i]),n,l - 1,c_x + 80*g_gk[l]*Math.cos((i/g_gk[l])*2*Math.PI),c_y + 80*g_gk[l]*Math.sin((i/g_gk[l])*2*Math.PI));
    }
    //部分三，连接在本层下的所有低一层的dcell
    for(i = 0;i < g_tk[l - 1];i++){
        for(j = i + 1;j < g_gk[l];j++){
            uid_1 = j - 1;
            uid_2 = i;
            tuple_1 = uid2tuple(uid_1,l,g_tk);  //转换成元祖
            tuple_2 = uid2tuple(uid_2,l,g_tk);
            n1 = g_node_map[String(pref.concat([i],tuple_1))];
            n2 = g_node_map[String(pref.concat([j],tuple_2))];
            g_edges.push({param:edge_param,id:g_edge_id++,from:n1,to:n2});  //连接dcell
        }
    }
}
function draw_dcell(n,l) {
    //生成常用的参数，gk表示DCellk包含有的DCellk-1的数量；tk表示DCellk包含有的服务器数量
    //注意，该函数不是线程安全的
    for(var i = 0;i < 10;i++){  //最多支持10层dcell,其实10层的话，网络特别大了
        if(i == 0){
            g_gk[i] = 1;
            g_tk[i] = n;
        }else{
            g_gk[i] = g_tk[i - 1] + 1;
            g_tk[i] = g_gk[i]*g_tk[i - 1];
        }
    }
    g_node_id = 0;
    g_snode_id = MAX_NUM;
    g_nodes = [];
    g_node_map = {};
    build_dcell([],n,l - 1,0,0);
    return {switchid_start:g_switchid_start,degree:n,level:l,gk:g_gk,tk:g_tk,edges:g_edges,nodes:g_nodes};
}


