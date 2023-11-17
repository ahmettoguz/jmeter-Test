# Description

* Script klasöründe prepare.sh dosyasına executable yetkisi veriyoruz.

* prepare sh ile k8s ve jmx dosyalarını configürasyonları yapılıyor. (-p -t, sıraysıla pod ve thread sayıları)
  
* up sh ile podları hazırlıyoruz ve testleri koşuyoruz

* Sonuçları results klasörüne getirmek silmek için result.sh çalıştırıyoruz.

* Oluşturulan podları silmek için down sh çalıştırıyoruz.

</br>

# Commands

```
chmod +x prepare.sh
```
```
./prepare.sh -p 1 -t 10
```

```
./up.sh
```

```
./result.sh
```

```
./down.sh
```