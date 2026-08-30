from django.urls import path
from . import views

urlpatterns = [
    path('', views.index_view, name='index'),
    path('index.html', views.index_view, name='index_html'),
    path('contacto.html', views.contacto_view, name='contacto'),
    path('pedido.html', views.pedido_view, name='pedido'),
    path('activador.html', views.activador_view, name='activador'),
    path('api/verify-purchase/', views.verify_purchase, name='verify_purchase'),
    path('api/save-paypal-purchase/', views.save_paypal_purchase, name='save_paypal_purchase'),
    path('admin/exportar-reporte-general/', views.export_master_report_excel, name='export_master_report_excel'),
    path('submit-pedido/', views.submit_physical_order, name='submit_pedido'),
    path('submit-contacto/', views.submit_contact, name='submit_contacto'),
]

